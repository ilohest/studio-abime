import { defineArrayMember, defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { languageField } from '../../lib/i18n';
import { looseSheetModules } from '../objects/looseSheets';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

export const actu = defineType({
  name: 'actu', title: 'Actu', type: 'document', icon: DocumentTextIcon,
  fields: [
    languageField,
    orderRankField({ type: 'actu' }),
    // Conserver les valeurs historiques sans proposer de saisie ni de tri par date.
    defineField({ name: 'date', type: 'date', hidden: true, readOnly: true }),
    defineField({ name: 'title', title: 'Titre', type: 'string', validation: r => r.required().max(100) }),
    defineField({ name: 'visible', title: 'Visible sur le site', type: 'boolean', initialValue: true,
      description: 'L’accueil affiche au maximum les six premières actus visibles, dans l’ordre de la liste Actus. Réorganisez la liste par glisser-déposer. Désactivé, cette actu est masquée.' }),
    defineField({ name: 'status', title: 'Sous-titre', type: 'string', validation: r => r.max(180) }),
    defineField({ name: 'template', title: 'Gabarit', type: 'string', initialValue: 'modules',
      options: { layout: 'radio', list: [{ title: 'Composition à blocs', value: 'modules' }, { title: 'Texte annoté', value: 'annotated' }] },
      validation: r => r.custom(value => !value || ['modules', 'annotated'].includes(value) ? true : 'Choisissez un gabarit disponible.') }),
    defineField({ name: 'modules', title: 'Composition de la feuille', type: 'array',
      hidden: ({ document }) => document?.template === 'annotated',
      of: looseSheetModules.map(m => defineArrayMember({ type: m.name })),
      validation: r => r.max(8).custom((value, context) => context.document?.template === 'annotated' || (Array.isArray(value) && value.length > 0) ? true : 'Ajoutez au moins un bloc.') }),
    defineField({ name: 'annotatedText', title: 'Texte annoté', type: 'array',
      description: 'Sélectionnez un mot ou une expression, puis ajoutez une « Note en marge ». La numérotation est automatique ; sur mobile, les notes suivent le texte.',
      hidden: ({ document }) => document?.template !== 'annotated',
      of: [defineArrayMember({ type: 'block', styles: [{ title: 'Paragraphe', value: 'normal' }], lists: [],
        marks: { decorators: [{ title: 'Italique', value: 'em' }, { title: 'Gras', value: 'strong' }],
          annotations: [defineArrayMember({ name: 'footnote', title: 'Note en marge', type: 'object',
            fields: [defineField({ name: 'text', title: 'Note', type: 'text', rows: 3, validation: r => r.required().max(600) })] })] } })],
      validation: r => r.custom((value, context) => context.document?.template !== 'annotated' || (Array.isArray(value) && value.some(block => {
        const children = (block as { children?: { text?: string }[] } | null)?.children;
        return children?.some(span => span.text?.trim());
      })) ? true : 'Ajoutez le texte principal.') }),
    defineField({ name: 'footerLink', title: 'Bouton du footer', type: 'link',
      hidden: ({ document }) => document?.template !== 'annotated' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'title', visible: 'visible' },
    prepare: ({ title, visible }) => ({ title: title || 'Actu sans titre', subtitle: visible === false ? 'Masquée' : 'Accueil · parmi les six premières visibles' }),
  },
});
