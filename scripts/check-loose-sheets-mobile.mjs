import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { loadEnv } from 'vite';

// Live-site regression: the layout viewport used to grow during a sheet
// transition while the visual viewport stayed narrow, hiding the hamburger.
// Run against a local dev server only; never send maintenance credentials
// to a remote origin. Browser binaries: npx playwright install chromium webkit.
const origin = new URL(process.env.MOBILE_TEST_URL ?? 'http://localhost:4323/');
assert(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Use a local test server.');
const password = (loadEnv('development', process.cwd(), '').MAINTENANCE_PASSWORD ?? '').trim();
const engines = (process.env.MOBILE_TEST_ENGINES ?? 'chromium').split(',');
const widths = (process.env.MOBILE_TEST_WIDTHS ?? '362,390,650').split(',').map(Number);
const output = process.env.MOBILE_TEST_OUTPUT;
if (output) mkdirSync(output, { recursive: true });

for (const engine of engines) {
  assert(['chromium', 'webkit'].includes(engine), 'Unknown test engine.');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({
    headless: true,
    ...(engine === 'chromium' && existsSync(chromePath) ? { executablePath: chromePath } : {}),
  });
  try {
    for (const width of widths) for (const reducedMotion of ['no-preference', 'reduce']) {
      const height = width === 362 ? 789 : width === 650 ? 1324 : 844;
      const context = await browser.newContext({
        viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion,
      });
      try {
        if (password) {
          const access = await context.request.post(origin.href, {
            headers: { Origin: origin.origin }, form: { password, next: '/' },
          });
          assert(access.ok(), `Local maintenance access failed: HTTP ${access.status()}`);
        }
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        await page.goto(origin.href);
        await page.locator('[data-loose-sheets][data-enhanced]').waitFor();
        await page.evaluate(() => Promise.race([
          document.fonts.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Fonts did not settle')), 15000)),
        ]));
        // The development toolbar can cover the carousel controls. It is
        // unrelated to the public site and must not intercept test taps.
        await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
        await page.waitForTimeout(1000);
        const count = await page.locator('[data-sheet-panel]').count();
        assert(count > 1, 'The regression needs at least two real sheets.');
        const panelTop = await page.locator('[data-sheet-panel]:not([hidden])').evaluate(e => e.getBoundingClientRect().top + scrollY);
        await page.evaluate(y => scrollTo({ top: y + 100, behavior: 'instant' }), panelTop);
        await page.waitForTimeout(500);
        const y = await page.evaluate(() => scrollY);
        assert(await page.locator('[data-sheet-panel]:not([hidden])').evaluate(e => e.getBoundingClientRect().top < 0), 'Test with the card top offscreen.');
        for (let step = 0; step < count; step++) {
          await page.evaluate(() => {
            window.__sheetViewportFrames = [];
            const sample = () => {
              const button = document.querySelector('[data-services-toggle]');
              const logo = document.querySelector('.services-rail__mobile-logo');
              const b = button.getBoundingClientRect();
              const l = logo.getBoundingClientRect();
              const panel = document.querySelector('[data-sheet-panel]:not([hidden])');
              const p = panel.getBoundingClientRect();
              window.__sheetViewportFrames.push({ width: innerWidth, visual: visualViewport.width, y: scrollY, right: b.right, top: b.top, logoTop: l.top, panel: panel.id, panelTop: p.top, panelHeight: p.height, opacity: Number(getComputedStyle(panel).opacity) });
              if (window.__sheetViewportFrames.length < 32) requestAnimationFrame(sample);
            };
            sample();
          });
          const b = await page.locator('[data-sheet-next]').boundingBox();
          assert(b && b.y >= 0 && b.y + b.height <= height, 'Carousel control must be visible.');
          // Locator.click() scrolls controls into view and would conceal or
          // introduce a scroll defect. Send an actual tap at visible coordinates.
          await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
          await page.waitForTimeout(600);
          await page.waitForFunction(() => {
            const panel = document.querySelector('[data-sheet-panel]:not([hidden])');
            return panel && !document.querySelector('[data-sheet-moving]') && panel.getAnimations().every(a => a.playState === 'finished' || a.playState === 'idle');
          });
          const frames = await page.evaluate(() => window.__sheetViewportFrames);
          assert(frames.length > 1, 'No transition frames were sampled.');
          const bad = frames.filter(f => Math.abs(f.width - width) > 1 || Math.abs(f.visual - width) > 1 || f.y !== y || f.right > width || f.top !== 16 || f.logoTop !== 16);
          assert.equal(bad.length, 0, `${engine}/${width}/${reducedMotion}: viewport/header/scroll drift ${JSON.stringify(bad)}`);
          for (const id of new Set(frames.map(f => f.panel))) {
            const visible = frames.filter(f => f.panel === id && f.opacity > .05);
            if (visible.length > 1) {
              for (const key of ['panelTop', 'panelHeight']) {
                assert(Math.max(...visible.map(f => f[key])) - Math.min(...visible.map(f => f[key])) <= 1, `Card geometry changed during its fade: ${key}`);
              }
            }
          }
          assert.equal(await page.evaluate(() => scrollY), y, 'Changing sheets must preserve page scroll.');
          assert.equal((await page.locator('[data-sheet-position]').textContent()).trim(), `${(step + 1) % count + 1} / ${count}`);
          assert(await page.evaluate(() => ['[data-services-toggle]', '.services-rail__mobile-logo'].every(s => {
            const e = document.querySelector(s), r = e.getBoundingClientRect(), c = getComputedStyle(e);
            return c.visibility === 'visible' && c.opacity === '1' && r.right <= visualViewport.width && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          })), 'The header must be visible and receive input in the visual viewport.');
          if (output && step === Math.min(1, count - 1)) await page.screenshot({ path: join(output, `${engine}-${width}-${reducedMotion}.png`) });
        }
        const button = await page.locator('[data-services-toggle]').boundingBox();
        await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
        assert.equal(await page.locator('[data-services-toggle]').getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-services-toggle]').getAttribute('aria-expanded'), 'false');
        console.log(`PASS ${engine} ${width}px ${reducedMotion}: ${count} taps, stable viewport/header/scroll, menu works`);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
