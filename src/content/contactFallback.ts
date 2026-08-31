import type { Locale } from '~/i18n/config';
import type { ContactPage } from '~/lib/sanity/types';

/**
 * Texte de la section « Informations » de la page Contact.
 *
 * Même rôle que `homeFallback`, `laboFallback` et `shopFallback` : porter le
 * contenu réel tant que le singleton `contactPage` n'a pas été publié. Ce
 * fichier devient inutile — et supprimable — le jour où il l'est.
 *
 * Ce sont les mots qui étaient écrits en dur dans le composant avant que la
 * section devienne éditable : ils ne changent donc rien à ce que le visiteur
 * lit, ils changent seulement qui peut les corriger.
 *
 * L'adresse e-mail n'y figure pas. Elle vient des réglages du site, comme
 * partout ailleurs (voir `sanity/schemaTypes/singletons/contactPage.ts`).
 */
export function getContactFallback(locale: Locale): ContactPage {
  return {
    _id: 'contactPage-fallback',
    _type: 'contactPage',
    language: locale,
    opening: 'Bienvenue dans le Studio,',
    paragraphs: [
      'Écrire ici, c’est déjà commencer.',
      'On vous lit et on répond en quelques jours.',
      'Si ce que vous décrivez ne relève pas de nos services, on vous le dit, et on vous oriente.',
    ],
    mailInvitation: 'Le formulaire vous fait peur ? Envoyez vos mots à',
  };
}
