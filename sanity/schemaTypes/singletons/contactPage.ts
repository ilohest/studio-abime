import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Contenu éditorial de la page Contact.
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
    { name: 'enquiry', title: 'Enquête' },
    { name: 'index', title: 'Index' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    /*
      Mention de bas de fiche. Le formulaire lui-même n'est pas éditorial — ses
      questions sont la structure d'un traitement de données — mais ce qui
      advient de la fiche l'est, et c'est l'information légale due au visiteur.
      Elle s'affiche sous le formulaire et reste lisible après l'envoi.
    */
    defineField({
      name: 'enquiryNotice',
      title: 'Mention de bas de fiche',
      type: 'text',
      rows: 4,
      group: 'enquiry',
      description:
        'Ce que devient la fiche : qui la lit, combien de temps elle est conservée, comment la faire effacer. Composée en petit corps, sous un filet.',
    }),
    /*
      L'index qui referme le site. Curaté à la main : un index est un acte
      éditorial, pas une table générée — c'est ce qui fait qu'on le lit.
    */
    defineField({
      name: 'index',
      title: 'Entrées de l’index',
      type: 'array',
      group: 'index',
      of: [defineArrayMember({ type: 'indexEntry' })],
      description:
        'Le vocabulaire du studio et ses renvois. Classées automatiquement par ordre alphabétique au rendu : l’ordre de saisie n’a pas d’importance. En dessous d’une quarantaine d’entrées, l’index se lit comme un encart et non comme un appareil.',
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
