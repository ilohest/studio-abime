import type { Locale } from '~/i18n/config';

/**
 * Texte d'introduction de la boutique.
 *
 * Même rôle que `homeFallback` et `laboFallback` : porter un contenu réel tant
 * que Sanity n'a pas de document dédié. Dès qu'un singleton `shopPage` existera,
 * ce texte deviendra son repli et la cliente l'éditera depuis le Studio.
 *
 * Il tient la place que la charte lui donne : la prise de position se lit une
 * fois, en haut, et cadre toutes les fiches qui suivent. Les cartes restent donc
 * sèches — titre, formats, prix.
 */
const intro: Record<string, string> = {
  fr:
    "On n'achète pas une image, on investit dans une vision. Chaque tirage prolonge une " +
    'enquête menée sur le terrain et propose une piste concrète à installer dans son ' +
    'quotidien — un objet avec lequel vivre, plutôt qu’un décor de plus.',
  en:
    'You are not buying an image, you are investing in a way of seeing. Each print extends ' +
    'a field investigation and offers something concrete to live with, rather than one more ' +
    'piece of decoration.',
};

export function getShopIntro(locale: Locale): string {
  return intro[locale] ?? intro.fr!;
}
