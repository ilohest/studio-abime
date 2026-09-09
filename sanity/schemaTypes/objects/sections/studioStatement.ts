import { defineArrayMember, defineField, defineType } from "sanity";

import { PLATE_FIGURES } from "../../../../src/lib/sections";

/**
 * Manifeste illustré — déclaration en grand, note de bas de bloc et planche de
 * figures légendées.
 *
 * Les numéros de figure (fig.05, fig.06…) NE SE SAISISSENT PLUS : ils se
 * déduisent du rang, et la série continue celle de la note — la note porte
 * « fig. 04 », la planche enchaîne à 05. Un repère encore écrit dans une
 * légende ancienne est retiré au rendu, pour qu'une figure ne porte jamais
 * deux numéros contradictoires (voir `src/lib/figureLabel.ts`).
 */
export const studioStatement = defineType({
  name: "studioStatement",
  title: "Méthode",
  type: "object",
  groups: [
    { name: "text", title: "Textes", default: true },
    { name: "figures", title: "Figures" },
  ],
  fields: [
    defineField({
      name: "statement",
      title: "Déclaration",
      type: "text",
      rows: 4,
      group: "text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 3,
      group: "text",
      /*
        Le repère et le texte tiennent dans un seul champ : `figureLabel()` les
        sépare au rendu. La description doit donc dire la CONVENTION, pas
        donner un exemple isolé — « Fig. 04 » seul se lisait comme une étiquette
        du champ, et personne ne devinait qu'il fallait l'écrire dans le texte.
      */
      description: "",
    }),
    defineField({
      name: "figures",
      title: "Figures",
      type: "array",
      group: "figures",
      description:
        "La planche compte cinq figures, à leur place fixe. On remplace leur visuel et leur légende ; l’ordre, lui, est celui de la mise en page.",
      /*
        COMPOSITION FIGÉE — mais pas VERROUILLÉE.

        Les cinq positions sont écrites en dur dans le composant : une sixième
        figure n'aurait aucune place où aller. D'où le plafond, tenu par la
        validation ci-dessous.

        Toutes les actions étaient coupées, `add` et `remove` compris. C'était
        une impasse : un bloc « Méthode » posé à neuf naît avec ZÉRO figure, et
        sans bouton d'ajout personne ne pouvait plus lui en donner. La planche
        disparaissait alors de la page sans que rien, ni au Studio ni à
        l'écran, n'explique pourquoi. Le contenu de la page d'accueil ne le
        montrait pas — il avait été semé avec ses cinq figures.

        On garde donc ce qui relève de la MISE EN PAGE — l'ordre (`sortable`),
        la duplication, le copier, l'insertion à un rang choisi — et on rend ce
        qui relève du CONTENU : poser une figure, en retirer une.

        `disableActions` est marqué @beta par Sanity ; c'est malgré tout la
        bonne voie, pour les mêmes raisons que dans `definePageBuilder`.
      */
      options: {
        sortable: false,
        disableActions: ["addBefore", "addAfter", "duplicate", "copy"],
      },
      /*
        Le plafond est une ERREUR et non un avertissement : au-delà de cinq, la
        figure n'est pas mal composée, elle n'est pas composée du tout — elle
        tombe hors des positions de la planche. Mieux vaut retenir la
        publication que livrer une rangée cassée.
      */
      validation: (rule) =>
        rule.max(PLATE_FIGURES).error(
          `La planche ne compte que ${PLATE_FIGURES} positions : une figure de plus n’aurait aucune place où aller.`,
        ),
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "image",
              title: "Visuel",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({
                  name: "alt",
                  title: "Texte alternatif",
                  type: "string",
                }),
              ],
              /*
                Plus obligatoire : une figure peut désormais être une vidéo.
                L'exigence porte sur le COUPLE — voir la validation de l'objet,
                plus bas — plutôt que sur ce champ seul, sinon on ne pourrait
                jamais poser une vidéo sans poser aussi une image.
              */
            }),
            defineField({
              name: "video",
              title: "Vidéo",
              type: "file",
              options: { accept: "video/mp4,video/webm" },
              description:
                "À la place de l’image. Court, muet, et fait pour tourner en boucle : la planche est une suite de tirages, pas un lecteur. MP4 ou WebM.",
            }),
            defineField({
              name: "caption",
              title: "Légende",
              type: "string",
              description:
                "Ex. « fig.05 — Compréhension de la constitution ». Le repère de tête est mis en forme automatiquement.",
            }),
          ],
          /*
            L'un OU l'autre, et pas les deux : renseigner les deux laisserait
            l'éditrice croire que l'image sert d'affiche à la vidéo, alors que
            le rendu ne montrerait que la vidéo. Mieux vaut le dire ici.
          */
          validation: (rule) =>
            rule.custom((figure?: { image?: unknown; video?: unknown }) => {
              if (!figure) return true;
              const hasImage = Boolean((figure.image as { asset?: unknown })?.asset);
              const hasVideo = Boolean((figure.video as { asset?: unknown })?.asset);

              if (!hasImage && !hasVideo) return "Posez une image ou une vidéo.";
              if (hasImage && hasVideo) {
                return "Image ET vidéo : seule la vidéo sera affichée. Retirez l’une des deux.";
              }
              return true;
            }),
          preview: {
            select: { caption: "caption", media: "image", video: "video.asset" },
            prepare: ({ caption, media, video }) => ({
              title: caption || "Figure",
              subtitle: video ? "Vidéo" : undefined,
              media,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "marker",
      title: "Mention technique",
      type: "string",
      group: "figures",
      description:
        "Courte annotation posée AU MILIEU de la planche, à une place fixée par la mise en page. On en change le texte, pas l’emplacement.",
    }),
  ],
  preview: {
    select: { statement: "statement", figures: "figures" },
    prepare: ({ statement, figures }) => ({
      title: "Manifeste illustré",
      subtitle: statement?.slice(0, 60),
      media: figures?.[0]?.image,
    }),
  },
});
