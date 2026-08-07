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
import type { CategoryView, ProjectCardView } from '~/lib/viewModels';

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
      tag="ul"
      name="project"
      class="mt-8 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
    >
      <li v-for="project in filteredProjects" :key="project.id" class="project-item">
        <a :href="project.href" class="group block">
          <div class="overflow-hidden bg-sable">
            <img
              v-if="project.image"
              :src="project.image.src"
              :srcset="project.image.srcset"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              :width="project.image.width"
              :height="project.image.height"
              :alt="project.image.alt"
              loading="lazy"
              decoding="async"
              class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>

          <h3 class="type-sous-titre mt-4">{{ project.title }}</h3>

          <p v-if="project.client || project.year" class="type-annotation mt-1 text-muted">
            <span v-if="project.client">{{ project.client }}</span>
            <span v-if="project.client && project.year"> — </span>
            <span v-if="project.year">{{ project.year }}</span>
          </p>

          <span class="sr-only">{{ labels.viewProject }}</span>
        </a>
      </li>
    </TransitionGroup>

    <p v-if="filteredProjects.length === 0" class="type-copy mt-12 text-muted">
      {{ labels.empty }}
    </p>
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
