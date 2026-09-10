import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';
import {
  ALL_RUBRICS,
  LIBRARY_RUBRICS,
} from '../../../src/content/libraryRubrics';

/**
 * Accueil de la Bibliothèque.
 *
 * ── Ce que porte cette page ─────────────────────────────────────────────────
 * Un seul texte continu. Certains de ses mots ouvrent une rubrique : c'est le
 * SEUL chemin vers les articles depuis cette page — il n'y a ni menu de
 * rubriques, ni grille, ni liste. Le sommaire est écrit, pas listé.
 *
 * ── Comment on marque un mot ────────────────────────────────────────────────
 * On sélectionne le mot dans le texte, puis on applique l'annotation
 * « Rubrique » (l'icône ⌗ de la barre d'outils) et on choisit laquelle. Le
 * site s'occupe du reste : l'encadré tracé autour du mot et le trait qui le
 * relie au suivant.
 *
 * Les six mots doivent être présents — les cinq rubriques et « tout ». Un mot
 * oublié rend une section du site inatteignable ; la page affiche alors un
 * rattrapage en bas de texte, mais mieux vaut ne pas en arriver là.
 *
 * Le type reste `journalPage` : le renommer imposerait de migrer le document
 * existant pour un gain purement cosmétique.
 */
export const journalPage = defineType({
  name: 'journalPage',
  title: 'Page Bibliothèque',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'composition',
      title: 'Texte de la page',
      type: 'array',
      group: 'content',
      description:
        'Le texte d’accueil. Sélectionner un mot et lui appliquer l’annotation « Rubrique » ' +
        'pour en faire une porte vers l’une des cinq rubriques — ou vers l’ensemble.',
      of: [
        defineArrayMember({
          type: 'block',
          // Aucun style, aucune liste, aucune autre marque : ce texte n'a pas de
          // mise en forme propre. Il a des portes, et rien d'autre.
          styles: [{ title: 'Paragraphe', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              {
                name: 'rubricLink',
                title: 'Rubrique',
                type: 'object',
                icon: () => '⌗',
                fields: [
                  defineField({
                    name: 'rubric',
                    title: 'Ouvre',
                    type: 'string',
                    options: {
                      list: [
                        ...LIBRARY_RUBRICS.map(({ value, title }) => ({ value, title })),
                        { value: ALL_RUBRICS, title: 'Tout — l’ensemble des rubriques' },
                      ],
                    },
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      /*
        LE VERSO — l'envers de la feuille.

        La page montre en transparence, retourné, un texte qu'on ne lit pas :
        c'est l'encre du dos du papier. Par défaut, c'est le texte d'accueil
        lui-même — la page vue par son propre revers, ce qui est déjà juste.

        Ce champ sert à en mettre un AUTRE : une liste, un fragment, une note
        de travail, ce qu'on veut faire deviner sans le donner à lire. Laissé
        vide, le texte d'accueil reprend sa place.

        Un simple texte, sans mise en forme ni lien : à 8 % d'opacité et
        retourné, rien de tout cela ne se verrait. Une ligne vide sépare deux
        paragraphes. Il est répété autant de fois qu'il en faut pour tenir la
        hauteur du bloc — inutile d'écrire long.
      */
      name: 'verso',
      title: 'Texte du verso',
      type: 'text',
      rows: 6,
      group: 'content',
      description:
        'Texte aperçu par transparence derrière la page, retourné et presque effacé. ' +
        'Laisser vide pour y montrer le texte d’accueil lui-même.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      options: { collapsible: false },
    }),
  ],
  preview: {
    select: { language: 'language' },
    prepare: ({ language }) => ({
      title: 'Page Bibliothèque',
      subtitle: language?.toUpperCase() ?? '—',
    }),
  },
});
