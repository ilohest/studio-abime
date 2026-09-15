import { defineArrayMember, defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';

const text = (name: string, title: string, required = false) => defineField({ name, title, type: 'string', validation: r => required ? r.required().max(180) : r.max(180) });
const image = defineField({
  name: 'image', title: 'Image', type: 'image', options: { hotspot: true },
  fields: [defineField({ name: 'alt', title: 'Description alternative', type: 'string', validation: r => r.required() })],
  validation: r => r.required(),
});
const module = (name: string, title: string, fields: ReturnType<typeof defineField>[]) => defineType({
  name, title, type: 'object', icon: DocumentTextIcon, fields: [text('label', 'Intitulé (facultatif)'), ...fields],
  preview: { select: { label: 'label', media: 'image' }, prepare: ({ label, media }) => ({ title: label || title, subtitle: title, media }) },
});

export const looseSheetModules = [
  module('sheetText', 'Note de recherche', [defineField({ name: 'text', title: 'Texte', type: 'text', rows: 5, validation: r => r.required().max(900) })]),
  module('sheetImage', 'Image', [image, text('caption', 'Légende')]),
  module('sheetDetails', 'Détails circulaires', [defineField({ name: 'details', title: 'Détails', type: 'array', of: [defineArrayMember({ type: 'object', name: 'detail', fields: [image, text('caption', 'Légende')], preview: { select: { title: 'caption', media: 'image' } } })], validation: r => r.required().min(1).max(3) })]),
  module('sheetPalette', 'Palette', [defineField({ name: 'colors', title: 'Couleurs', type: 'array', of: [defineArrayMember({ type: 'object', name: 'swatch', fields: [defineField({ name: 'hex', title: 'Couleur hexadécimale', type: 'string', description: 'Par exemple #CED6E0. Une couleur observée, pas le fond de la feuille.', validation: r => r.required().regex(/^#[0-9a-fA-F]{6}$/) }), text('name', 'Nom de la couleur')], preview: { select: { title: 'name', subtitle: 'hex' } } })], validation: r => r.required().min(1).max(8) })]),
  module('sheetAxis', 'Axe de recherche', [text('left', 'Pôle gauche', true), text('right', 'Pôle droit', true), defineField({ name: 'position', title: 'Position (%)', type: 'number', initialValue: 50, validation: r => r.required().min(0).max(100) }), text('caption', 'Commentaire')]),
  module('sheetFacts', 'Relevé botanique', [defineField({ name: 'facts', title: 'Relevé', type: 'array', of: [defineArrayMember({ type: 'object', name: 'fact', fields: [text('label', 'Label', true), text('value', 'Valeur', true)], preview: { select: { title: 'label', subtitle: 'value' } } })], validation: r => r.required().min(1).max(8) })]),
  module('sheetLink', 'Lien pour poursuivre', [defineField({ name: 'link', title: 'Lien', type: 'link', validation: r => r.required() })]),
];
