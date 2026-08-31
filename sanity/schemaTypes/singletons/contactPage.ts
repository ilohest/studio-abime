import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Contenu éditorial de la page Contact — section « Informations » seulement.
 *
 * ── Ce que ce singleton ne porte PAS, et pourquoi ───────────────────────────
 * L'adresse e-mail et le lien Instagram s'affichent dans cette section, mais ne
 * se saisissent pas ici : ils vivent déjà dans Réglages du site → Identité et
 * réseaux sociaux, d'où les tirent aussi le pied de page et les données
 * structurées.
 *
 * Les redemander ici en ferait une seconde source, et deux sources finissent
 * toujours par diverger — on corrigerait l'adresse dans les réglages sans
 * penser à la page Contact, qui continuerait d'afficher l'ancienne. Le risque
 * n'est pas théorique : cette adresse était écrite en dur à trois endroits du
 * code avant ce changement.
 *
 * Le formulaire d'enquête n'est pas ici non plus : ses questions et ses
 * réponses sont la structure d'un traitement de données (voir
 * `src/pages/api/contact.ts`), pas du texte à retoucher.
 */
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Page Contact',
  type: 'document',
  groups: [
    { name: 'content', title: 'Informations', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'opening',
      title: 'Salutation',
      type: 'string',
      group: 'content',
      description: 'Première ligne, composée plus grand. Exemple : « Bienvenue dans le Studio, ».',
    }),
    defineField({
      name: 'paragraphs',
      title: 'Paragraphes',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'text', rows: 3 })],
      description:
        'Ce qu’on dit avant que la personne écrive : ce qui se passe après l’envoi, le délai de réponse, ce qu’on fait d’une demande hors sujet.',
    }),
    defineField({
      name: 'mailInvitation',
      title: 'Invitation à écrire directement',
      type: 'string',
      group: 'content',
      description:
        'Phrase précédant l’adresse e-mail, pour qui préfère le courrier au formulaire. L’adresse elle-même vient des réglages du site et s’ajoute à la suite.',
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
      title: 'Page Contact',
      subtitle: language?.toUpperCase() ?? '—',
    }),
  },
});
