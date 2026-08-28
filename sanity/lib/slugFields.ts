import { defineField } from 'sanity';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ADRESSE D'UNE PAGE, ET LA MÉMOIRE DE SES ADRESSES PASSÉES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagé par les projets et les articles du Journal : dans les deux cas
 * l'éditrice saisit un titre, et l'adresse en découle.
 *
 * ── La règle, empruntée à Shopify ───────────────────────────────────────────
 * L'adresse est tirée du titre à la PREMIÈRE publication, puis elle ne bouge
 * plus d'elle-même. Renommer « Jacqueline Atelier. » en « Jacqueline Atelier »
 * ne déplace pas la page.
 *
 * C'est le bon compromis, et il tient à une asymétrie : un titre se retouche
 * souvent — une coquille, une majuscule, un point final — alors qu'une adresse
 * publiée est une promesse faite à tous ceux qui l'ont copiée. Faire suivre
 * l'adresse à chaque retouche, c'est casser des liens pour une virgule.
 *
 * Mais une adresse figée finit par mentir : un projet publié sous un titre
 * provisoire garde son adresse provisoire pour toujours. D'où le second
 * mouvement — le champ est MODIFIABLE À LA MAIN, et ce geste-là, délibéré,
 * déclenche la question de la redirection (voir `slugOnPublishAction.tsx`).
 *
 * Les deux besoins sont ainsi servis sans que l'un sabote l'autre : l'adresse
 * ne bouge jamais par accident, et rien n'empêche de la corriger.
 */
export const slugField = defineField({
  name: 'slug',
  title: 'Adresse de la page',
  type: 'slug',
  group: 'seo',
  options: { source: 'title', maxLength: 96 },
  description:
    'Reprise du titre à la première publication. Renommer la page ne la déplace plus ensuite — si vous corrigez cette adresse à la main, l’ancienne sera redirigée vers la nouvelle.',
});

/**
 * Adresses que cette page a portées avant aujourd'hui.
 *
 * Alimenté à la publication, jamais à la main — d'où le champ masqué. Chaque
 * entrée devient une redirection permanente vers l'adresse actuelle, posée au
 * build (voir `astro.config.ts`). C'est ce qui permet de corriger une adresse
 * sans casser les liens déjà partagés : l'ancienne continue de mener au bon
 * endroit, simplement elle annonce le déménagement.
 *
 * La liste ne se vide pas. Une adresse ayant circulé une fois peut resurgir
 * des années plus tard — dans un signet, un e-mail, un article qui cite le
 * studio — et rien ne coûte à la garder.
 */
export const previousSlugsField = defineField({
  name: 'previousSlugs',
  title: 'Anciennes adresses',
  type: 'array',
  of: [{ type: 'string' }],
  hidden: true,
  readOnly: true,
});
