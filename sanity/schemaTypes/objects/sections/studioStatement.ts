import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Manifeste illustré — déclaration en grand, note de bas de bloc et planche de
 * figures légendées.
 *
 * Les numéros de figure (fig.04, fig.05…) sont saisis à la main et non générés :
 * la numérotation court d'une section à l'autre sur toute la page, une
 * numérotation automatique par section la casserait au premier réagencement.
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
        "La planche compte cinq figures, à leur place fixe. On remplace leur visuel et leur légende ; on n’en ajoute pas, on n’en retire pas.",
      /*
        COMPOSITION FIGÉE, comme l'enchaînement des blocs de la page d'accueil.
        Les cinq positions sont écrites en dur dans le composant : une sixième
        figure n'aurait aucune place où aller, et une cinquième retirée
        laisserait un trou dans le rythme de la planche.

        Couper les six actions retire le bouton d'ajout ET le menu « ⋮ » de
        chaque figure — dupliquer, copier, insérer avant/après, supprimer. Il
        reste l'ouverture de la figure et l'édition de ses champs.

        `disableActions` est marqué @beta par Sanity ; c'est malgré tout la
        bonne voie, pour les mêmes raisons que dans `definePageBuilder`.
      */
      options: {
        sortable: false,
        disableActions: [
          "add",
          "addBefore",
          "addAfter",
          "remove",
          "duplicate",
          "copy",
        ],
      },
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
