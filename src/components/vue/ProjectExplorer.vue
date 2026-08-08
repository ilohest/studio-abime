<script setup lang="ts">
/**
 * Explorateur de projets — composant Vue interactif.
 *
 * Rôle : filtrage instantané du portfolio par catégorie, sans rechargement.
 *
 * Contrat avec Astro :
 *  - il ne reçoit que des modèles de vue déjà résolus (`ProjectCardView`),
 *    jamais de documents Sanity bruts ;
 *  - il est hydraté en `client:visible` : aucun JavaScript n'est chargé tant
 *    que la liste n'entre pas dans le viewport.
 *
 * Le filtre actif est reflété dans l'URL (`?filtre=`) : un lien vers une
 * sélection reste partageable et le retour arrière du navigateur fonctionne.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { getProjectSpacerPositions, type CategoryView, type ProjectCardView } from '~/lib/viewModels';

const props = defineProps<{
  projects: ProjectCardView[];
  categories: CategoryView[];
  labels: {
    all: string;
    filterBy: string;
    empty: string;
    count: string;
    viewProject: string;
  };
  /** Nom du paramètre d'URL, traduit selon la langue. */
  queryParam?: string;
}>();

const ALL = '__all__';
const activeKey = ref<string>(ALL);
const paramName = computed(() => props.queryParam ?? 'filtre');

const filteredProjects = computed(() =>
  activeKey.value === ALL
    ? props.projects
    : props.projects.filter((project) => project.categoryKeys.includes(activeKey.value)),
);

type CatalogItem =
  | { kind: 'project'; key: string; project: ProjectCardView }
  | { kind: 'spacer'; key: string };

const catalogItems = computed<CatalogItem[]>(() => {
  const spacers = new Set(
    getProjectSpacerPositions(filteredProjects.value.map((project) => project.id)),
  );

  return filteredProjects.value.flatMap((project, index) => [
    { kind: 'project' as const, key: `project-${project.id}`, project },
    ...(spacers.has(index)
      ? [{ kind: 'spacer' as const, key: `spacer-${project.id}` }]
      : []),
  ]);
});

/** Restaure le filtre depuis l'URL au montage (lien partagé, retour arrière). */
onMounted(() => {
  const fromUrl = new URLSearchParams(window.location.search).get(paramName.value);
  if (fromUrl && props.categories.some((category) => category.key === fromUrl)) {
    activeKey.value = fromUrl;
  }

  window.addEventListener('popstate', () => {
    const key = new URLSearchParams(window.location.search).get(paramName.value);
    activeKey.value = key && props.categories.some((c) => c.key === key) ? key : ALL;
  });
});

watch(activeKey, (key) => {
  const url = new URL(window.location.href);
  if (key === ALL) url.searchParams.delete(paramName.value);
  else url.searchParams.set(paramName.value, key);
  window.history.pushState({}, '', url);
});

function isActive(key: string) {
  return activeKey.value === key;
}
</script>

<template>
  <div>
    <!-- Filtres -->
    <div
      v-if="categories.length > 0"
      class="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-5"
      role="group"
      :aria-label="labels.filterBy"
    >
      <button
        type="button"
        class="type-sous-titre cursor-pointer transition-opacity"
        :class="isActive(ALL) ? 'opacity-100 underline underline-offset-4' : 'opacity-45 hover:opacity-100'"
        :aria-pressed="isActive(ALL)"
        @click="activeKey = ALL"
      >
        {{ labels.all }}
        <span class="type-annotation ml-1 align-super text-[0.7em]">{{ projects.length }}</span>
      </button>

      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        class="type-sous-titre cursor-pointer transition-opacity"
        :class="
          isActive(category.key) ? 'opacity-100 underline underline-offset-4' : 'opacity-45 hover:opacity-100'
        "
        :aria-pressed="isActive(category.key)"
        @click="activeKey = category.key"
      >
        {{ category.title }}
        <span class="type-annotation ml-1 align-super text-[0.7em]">{{ category.count }}</span>
      </button>
    </div>

    <!-- Compteur, annoncé aux lecteurs d'écran à chaque changement de filtre -->
    <p class="type-annotation mt-4 text-muted" aria-live="polite">
      {{ filteredProjects.length }} {{ labels.count }}
    </p>

    <!-- Grille -->
    <TransitionGroup
      v-if="filteredProjects.length > 0"
      tag="ul"
      name="project"
      class="project-catalog-grid mt-8"
    >
      <li
        v-for="item in catalogItems"
        :key="item.key"
        class="project-item project-catalog-item"
        :aria-hidden="item.kind === 'spacer' ? 'true' : undefined"
      >
        <div v-if="item.kind === 'spacer'" class="project-catalog-card project-catalog-spacer">
          <span class="project-catalog-diagonal"></span>
        </div>

        <a v-else :href="item.project.href" class="project-catalog-card group">
          <header class="project-catalog-heading">
            <span class="project-catalog-number">{{ item.project.number }}</span>
            <h3>{{ item.project.title }}</h3>
          </header>

          <div class="project-catalog-media">
            <img
              v-if="item.project.image"
              :src="item.project.image.src"
              :srcset="item.project.image.srcset"
              sizes="(min-width: 1440px) 22vw, (min-width: 900px) 30vw, 50vw"
              :width="item.project.image.width"
              :height="item.project.image.height"
              :alt="item.project.image.alt"
              loading="lazy"
              decoding="async"
              class="project-catalog-image"
            />
          </div>

          <dl v-if="item.project.facts.length > 0" class="project-catalog-facts">
            <div v-for="fact in item.project.facts" :key="fact.key">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>

          <p v-if="item.project.excerpt" class="project-catalog-copy">{{ item.project.excerpt }}</p>

          <span class="sr-only">{{ labels.viewProject }}</span>
        </a>
      </li>
    </TransitionGroup>

    <ul v-else class="project-catalog-grid mt-8">
      <li class="project-catalog-item">
        <div class="project-catalog-card project-catalog-empty project-catalog-state-card" role="status">
          <span class="project-catalog-number">[01]</span>
          <p>{{ labels.empty }}</p>
        </div>
      </li>

      <li class="project-catalog-item" aria-hidden="true">
        <div class="project-catalog-card project-catalog-spacer project-catalog-state-card">
          <span class="project-catalog-number">[02]</span>
          <span class="project-catalog-diagonal"></span>
        </div>
      </li>

      <li class="project-catalog-item" aria-hidden="true">
        <div class="project-catalog-card project-catalog-state-card project-catalog-state-image-card">
          <span class="project-catalog-number">[03]</span>
          <div class="project-catalog-state-media">
            <img
              src="/media/studio-abime-fond-irise.jpg"
              width="1240"
              height="2048"
              alt=""
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </li>

      <li class="project-catalog-item">
        <div class="project-catalog-card project-catalog-state-card project-catalog-state-quote">
          <span class="project-catalog-number">[04]</span>
          <p>
            Communicare : mettre en commun. Relier. C’est le geste le plus ancien, celui qui nous a faits
            humains. À force de tout diffuser, en a-t-on oublié le sens ?
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Transitions de filtrage. Neutralisées si l'utilisateur réduit les animations
   (règle globale `prefers-reduced-motion` dans global.css). */
.project-enter-active,
.project-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.project-enter-from,
.project-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.project-leave-active {
  position: absolute;
}

.project-move {
  transition: transform 0.4s ease;
}
</style>
