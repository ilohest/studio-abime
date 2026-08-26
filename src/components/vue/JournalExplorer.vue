<script setup lang="ts">
/**
 * Explorateur du Journal — composant Vue interactif.
 *
 * Rôle : basculer entre l'ordre chronologique complet (vue par défaut) et
 * l'une des deux rubriques, sans rechargement.
 *
 * Contrat avec Astro, identique à `ProjectExplorer.vue` :
 *  - il ne reçoit que des modèles de vue déjà résolus (`PostCardView`) ;
 *  - il est hydraté en `client:visible` ;
 *  - la sélection est reflétée dans l'URL, donc partageable.
 *
 * Deux formes d'URL sont acceptées, parce que les deux existent déjà dans le
 * site : le paramètre `?rubrique=` qu'écrit le composant, et l'ancre
 * `#cahier-de-recherche` / `#actualites` du menu latéral.
 */
import { computed, onMounted, ref } from 'vue';
import type { JournalCategoryView, PostCardView } from '~/lib/journal';

const props = defineProps<{
  posts: PostCardView[];
  categories: JournalCategoryView[];
  labels: {
    all: string;
    filterBy: string;
    empty: string;
    emptyAll: string;
    count: string;
    read: string;
  };
  /** Nom du paramètre d'URL, traduit selon la langue. */
  queryParam?: string;
}>();

const ALL = '__all__';
const activeKey = ref<string>(ALL);
const paramName = computed(() => props.queryParam ?? 'rubrique');

const filteredPosts = computed(() =>
  activeKey.value === ALL
    ? props.posts
    : props.posts.filter((post) => post.categoryKey === activeKey.value),
);

function isKnown(key: string | null | undefined): key is string {
  return Boolean(key) && props.categories.some((category) => category.key === key);
}

/** Lit la sélection dans l'URL : l'ancre du menu d'abord, puis le paramètre. */
function readSelection(): string {
  const hash = window.location.hash.replace('#', '');
  if (isKnown(hash)) return hash;

  const param = new URLSearchParams(window.location.search).get(paramName.value);
  return isKnown(param) ? param : ALL;
}

onMounted(() => {
  activeKey.value = readSelection();

  window.addEventListener('popstate', () => {
    activeKey.value = readSelection();
  });
  window.addEventListener('hashchange', () => {
    activeKey.value = readSelection();
  });
});

/**
 * L'ancre est retirée en même temps que le paramètre est écrit : sans quoi une
 * ancre restée dans l'URL reprendrait la main au retour arrière et figerait le
 * filtre sur une rubrique que l'on vient de quitter.
 */
function select(key: string) {
  activeKey.value = key;

  const url = new URL(window.location.href);
  url.hash = '';
  if (key === ALL) url.searchParams.delete(paramName.value);
  else url.searchParams.set(paramName.value, key);
  window.history.pushState({}, '', url);
}

function isActive(key: string) {
  return activeKey.value === key;
}
</script>

<template>
  <div>
    <!-- Filtres : la vue par défaut est l'ordre chronologique complet. -->
    <div
      v-if="categories.length > 1"
      class="journal-filters"
      role="group"
      :aria-label="labels.filterBy"
    >
      <button
        type="button"
        class="journal-filter"
        :class="{ 'is-active': isActive(ALL) }"
        :aria-pressed="isActive(ALL)"
        @click="select(ALL)"
      >
        <span class="journal-filter__label">{{ labels.all }}</span>
        <span class="journal-filter__count">{{ posts.length }}</span>
      </button>

      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        class="journal-filter"
        :class="{ 'is-active': isActive(category.key) }"
        :aria-pressed="isActive(category.key)"
        @click="select(category.key)"
      >
        <span class="journal-filter__label">{{ category.title }}</span>
        <span class="journal-filter__count">{{ category.count }}</span>
      </button>
    </div>

    <!--
      Le décompte ne s'affiche plus, mais il reste annoncé : c'est le seul
      retour qu'ont les lecteurs d'écran quand un filtre change la liste.
    -->
    <p class="sr-only" aria-live="polite">
      {{ filteredPosts.length }} {{ labels.count }}
    </p>

    <TransitionGroup
      v-if="filteredPosts.length > 0"
      tag="ul"
      name="journal"
      class="project-catalog-grid mt-8"
    >
      <li v-for="post in filteredPosts" :key="post.id" class="journal-item project-catalog-item">
        <a
          :href="post.href"
          class="project-catalog-card group journal-card"
          :class="{ 'project-catalog-card--no-facts': post.facts.length === 0 }"
        >
          <header class="project-catalog-heading">
            <span class="project-catalog-number">{{ post.number }}</span>
            <time class="project-catalog-symbol" :datetime="post.dateIso">{{ post.dateStamp }}</time>
            <h3>{{ post.title }}</h3>
          </header>

          <div v-if="post.image" class="project-catalog-media">
            <img
              :src="post.image.src"
              :srcset="post.image.srcset"
              sizes="(min-width: 1440px) 22vw, (min-width: 900px) 30vw, 50vw"
              :width="post.image.width"
              :height="post.image.height"
              :alt="post.image.alt"
              loading="lazy"
              decoding="async"
              class="project-catalog-image"
            />
          </div>

          <dl v-if="post.facts.length > 0" class="project-catalog-facts">
            <div v-for="fact in post.facts" :key="fact.key">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>

          <p v-if="post.excerpt" class="project-catalog-copy">{{ post.excerpt }}</p>

          <span class="sr-only">{{ labels.read }}</span>
        </a>
      </li>
    </TransitionGroup>

    <ul v-else class="project-catalog-grid mt-8">
      <li class="project-catalog-item">
        <div class="project-catalog-card project-catalog-empty project-catalog-state-card" role="status">
          <span class="project-catalog-number">[01]</span>
          <p>{{ posts.length === 0 ? labels.emptyAll : labels.empty }}</p>
        </div>
      </li>

      <li class="project-catalog-item" aria-hidden="true">
        <div class="project-catalog-card project-catalog-spacer project-catalog-state-card">
          <span class="project-catalog-number">[02]</span>
          <span class="project-catalog-diagonal"></span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/*
  Rubriques du Journal, composées comme le sommaire d'une revue : libellés en
  italique de la charte, effectifs en exposant monospacé — l'appel de note d'un
  article scientifique. Le filet unique sous la ligne tient lieu de règle de
  sommaire.
*/
.journal-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem clamp(1.4rem, 3vw, 2.6rem);
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-line);
}

.journal-filter {
  display: inline-flex;
  align-items: baseline;
  gap: 0.28em;
  padding: 0.15em 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  font-family: var(--font-annotation);
  font-size: clamp(1rem, 1.3vw, 1.25rem);
  font-style: italic;
  letter-spacing: var(--tracking-annotation);
  line-height: 1.3;
  opacity: 0.45;
  transition: opacity 0.3s ease;
}

.journal-filter:hover,
.journal-filter:focus-visible,
.journal-filter.is-active {
  opacity: 1;
}

/*
  Le soulignement se déploie plutôt qu'il ne s'allume : peint en fond, sa
  longueur est animable, ce que `text-decoration` ne permet pas.
*/
.journal-filter__label {
  background-image: linear-gradient(currentColor, currentColor);
  background-position: left calc(100% - 0.02em);
  background-repeat: no-repeat;
  background-size: 0 1px;
  transition: background-size 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.journal-filter:hover .journal-filter__label,
.journal-filter:focus-visible .journal-filter__label,
.journal-filter.is-active .journal-filter__label {
  background-size: 100% 1px;
}

.journal-filter__count {
  align-self: flex-start;
  font-family: var(--font-titre);
  font-size: 0.58em;
  font-style: normal;
  letter-spacing: 0;
  line-height: 1.6;
}

/* Transitions de filtrage, neutralisées par la règle globale
   `prefers-reduced-motion`. */
.journal-enter-active,
.journal-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.journal-enter-from,
.journal-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.journal-leave-active {
  position: absolute;
}

.journal-move {
  transition: transform 0.4s ease;
}
</style>
