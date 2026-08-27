/**
 * Amorçage des pages légales portées par Sanity.
 *
 *   npm run legal:seed
 *
 * Crée trois pages institutionnelles — mentions légales, confidentialité,
 * cookies — avec une trame rédigée pour un studio belge vendant en ligne.
 *
 * DEUX PARTIS PRIS IMPORTANTS
 *
 * 1. Les documents sont créés EN BROUILLON. Un texte juridique se relit avant
 *    d'engager son auteur, et la trame contient des informations que ce script
 *    ne peut pas connaître (numéro BCE, TVA, hébergeur). Tant que le brouillon
 *    n'est pas publié depuis le Studio, la page n'est pas servie et son lien
 *    n'apparaît pas dans le pied de page — aucun risque de mettre en ligne un
 *    texte à trous.
 *
 * 2. Le script ne remplace JAMAIS un document existant. Relancé, il ignore ce
 *    qui est déjà là. Les seules pertes possibles sont donc celles que l'on
 *    demande explicitement.
 *
 * Les emplacements à compléter sont écrits « [À COMPLÉTER : … ] » : une
 * recherche du crochet ouvrant dans le Studio les trouve tous.
 *
 * Ce script est autonome, comme `shopify-check.mjs` : il lit `process.env` et ne
 * dépend d'aucun module du site. Il a besoin d'un jeton d'ÉCRITURE, à créer sur
 * sanity.io/manage → API → Tokens (rôle « Editor »), puis à placer dans `.env` :
 *
 *   SANITY_API_WRITE_TOKEN="sk..."
 *
 * Ce jeton n'est pas préfixé `PUBLIC_` : il ne doit jamais atteindre le
 * navigateur, et n'est utilisé que par ce script, en local.
 */
import { createClient } from "@sanity/client";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || "2025-02-19";
const token = process.env.SANITY_API_WRITE_TOKEN;
const language = process.env.LEGAL_SEED_LANGUAGE || "fr";

const ok = (message) => console.log(`\x1b[32m✓\x1b[0m ${message}`);
const skip = (message) => console.log(`\x1b[33m·\x1b[0m ${message}`);
const ko = (message) => console.error(`\x1b[31m✗\x1b[0m ${message}`);

if (!projectId || !token) {
  ko("Configuration incomplète.");
  console.error(
    "\n  Renseignez dans .env :\n" +
      "    PUBLIC_SANITY_PROJECT_ID\n" +
      "    SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens, rôle « Editor »)\n",
  );
  process.exit(1);
}

/* ── Construction du Portable Text ───────────────────────────────────────── */

/*
  Les clés sont dérivées d'un compteur plutôt que tirées au hasard : deux
  exécutions produisent le même document, ce qui rend les différences lisibles
  si l'on compare un jour deux datasets.
*/
let counter = 0;
const key = (prefix) => `${prefix}${(counter++).toString(36)}`;

/**
 * Traduit `[libellé](url)` en annotation `linkMark`, seule forme de lien
 * acceptée par le schéma `richText`. Le reste de la ligne devient du texte nu :
 * la trame n'a pas besoin de gras ni d'italique.
 */
function toSpans(text) {
  const spans = [];
  const marks = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      spans.push({
        _type: "span",
        _key: key("s"),
        text: text.slice(cursor, match.index),
        marks: [],
      });
    }

    const markKey = key("l");
    marks.push({
      _type: "linkMark",
      _key: markKey,
      kind: "external",
      externalUrl: match[2],
      openInNewTab: true,
    });
    spans.push({
      _type: "span",
      _key: key("s"),
      text: match[1],
      marks: [markKey],
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    spans.push({
      _type: "span",
      _key: key("s"),
      text: text.slice(cursor),
      marks: [],
    });
  }

  return { spans, marks };
}

/*
  Les noms de style employés dans la trame ci-dessous sont ceux d'un rédacteur —
  « p », « li » — et non ceux du schéma. Le schéma `richText` n'expose que quatre
  styles (`normal`, `h2`, `h3`, `blockquote`) et le Studio refuse d'ouvrir un
  document qui en porte un autre : « Could not find Sanity schema type for style ».
  La correspondance est donc explicite, et une clé inconnue échoue ici plutôt que
  de produire un document illisible.
*/
const BLOCK_STYLES = {
  p: "normal",
  li: "normal",
  h2: "h2",
  h3: "h3",
  quote: "blockquote",
};

/** `['h2', 'Titre']` ou `['p', 'Texte']` ou `['li', 'Élément']` → bloc Portable Text. */
function block([style, text]) {
  const resolved = BLOCK_STYLES[style];
  if (!resolved) throw new Error(`Style inconnu dans la trame : « ${style} »`);

  const { spans, marks } = toSpans(text);

  return {
    _type: "block",
    _key: key("b"),
    style: resolved,
    ...(style === "li" ? { listItem: "bullet", level: 1 } : {}),
    markDefs: marks,
    children: spans,
  };
}

/**
 * Un document `page` prêt à être créé, avec un unique bloc de texte.
 *
 * L'identifiant porte la langue — `page-legal-notice-fr` — parce que le
 * back-office ouvre ces pages par identifiant fixe (voir `sanity/structure`) et
 * qu'une seconde langue produirait sinon une collision silencieuse.
 */
/*
  Le titre ne fait plus partie du document : les pages `page` n'en portent pas,
  leur intitulé vient du code (voir `LEGAL_TITLES` dans le schéma et
  `src/i18n/ui.ts` pour le site). Il reste ici pour les messages de la console.
*/
function legalPage({ id, title, description, body }) {
  return {
    label: title,
    doc: {
      _id: `drafts.${id}-${language}`,
      _type: "page",
      language,
      sections: [
        {
          _type: "richTextSection",
          _key: key("sec"),
          body: body.map(block),
        },
      ],
      seo: { _type: "seo", description },
    },
  };
}

/* ── Contenu ─────────────────────────────────────────────────────────────── */

const TODO = {
  form: "[À COMPLÉTER : forme juridique — SRL, entreprise personne physique…]",
  address: "[À COMPLÉTER : rue, numéro, code postal, commune]",
  bce: "[À COMPLÉTER : numéro d’entreprise BCE — 0XXX.XXX.XXX]",
  vat: "[À COMPLÉTER : numéro de TVA — BE 0XXX.XXX.XXX]",
  phone: "[À COMPLÉTER : numéro de téléphone, ou supprimer cette ligne]",
  host: "[À COMPLÉTER : nom et adresse de l’hébergeur du site]",
  email: "[À COMPLÉTER : adresse e-mail professionnelle du studio]",
  court: "[À COMPLÉTER : arrondissement judiciaire — celui du siège]",
};

const pages = [
  legalPage({
    id: "page-legal-notice",
    title: "Mentions légales",
    description:
      "Identité de l’éditeur du site Studio Abîme, coordonnées, hébergement et conditions d’utilisation des contenus.",
    body: [
      [
        "p",
        "Les informations qui suivent identifient l’éditeur de ce site et précisent les conditions dans lesquelles il est publié.",
      ],

      ["h2", "Éditeur du site"],
      ["p", `Studio Abîme — ${TODO.form}`],
      ["p", `Siège : ${TODO.address}`],
      ["p", `Numéro d’entreprise (BCE) : ${TODO.bce}`],
      ["p", `Numéro de TVA : ${TODO.vat}`],
      ["p", `E-mail : ${TODO.email}`],
      ["p", `Téléphone : ${TODO.phone}`],
      ["p", "Responsable de la publication : Isaure Lohest."],

      ["h2", "Hébergement"],
      ["p", `Le site est hébergé par ${TODO.host}`],
      [
        "p",
        "Le contenu éditorial est géré via Sanity (Sanity AS, Norvège). La boutique et le tunnel de paiement sont opérés par Shopify International Ltd (Irlande), qui héberge à ce titre les données de commande.",
      ],

      ["h2", "Propriété intellectuelle"],
      [
        "p",
        "L’ensemble des contenus présents sur ce site — textes, photographies, illustrations, vidéos, identité visuelle, mise en page et code — est protégé par le droit d’auteur et reste la propriété de Studio Abîme ou de ses ayants droit.",
      ],
      [
        "p",
        "Toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, sur quelque support que ce soit, est interdite sans autorisation écrite préalable. Les travaux présentés dans le portfolio peuvent comporter des éléments dont les droits appartiennent aux clients concernés ou à des tiers.",
      ],

      ["h2", "Liens vers d’autres sites"],
      [
        "p",
        "Ce site peut renvoyer vers des sites tiers, sur lesquels Studio Abîme n’exerce aucun contrôle. Leur contenu, leurs pratiques et leurs politiques n’engagent que leurs éditeurs respectifs.",
      ],

      ["h2", "Crédits"],
      ["p", "Conception et développement : Isaure Lohest."],

      ["h2", "Droit applicable"],
      [
        "p",
        `Le présent site est soumis au droit belge. En cas de litige, et à défaut de résolution amiable, les cours et tribunaux de l’arrondissement de ${TODO.court} sont seuls compétents — sans préjudice des règles protectrices applicables aux consommateurs.`,
      ],

      ["h2", "Litiges de consommation"],
      [
        "p",
        "Un client consommateur qui n’obtiendrait pas satisfaction après nous avoir contactés peut saisir gratuitement le Service de médiation pour le consommateur, Boulevard du Roi Albert II 8 boîte 1, 1000 Bruxelles.",
      ],
      [
        "p",
        "Plus d’informations : [consumerombudsman.be](https://consumerombudsman.be).",
      ],
      [
        "p",
        "Note à l’usage de l’éditeur — à supprimer avant publication : ne pas ajouter de lien vers la plateforme européenne de règlement en ligne des litiges (RLL/ODR). Elle a cessé de fonctionner en 2025, alors qu’elle figure encore dans la plupart des modèles de mentions légales en circulation.",
      ],
    ],
  }),

  legalPage({
    id: "page-legal-privacy",
    title: "Politique de confidentialité",
    description:
      "Comment Studio Abîme collecte, utilise et protège vos données personnelles sur le site et dans la boutique, et comment exercer vos droits.",
    body: [
      ["p", "[À COMPLÉTER : date de dernière mise à jour]"],
      [
        "p",
        "Studio Abîme exploite ce site et la boutique qui y est rattachée. Cette politique décrit les données personnelles que nous traitons, pourquoi, avec qui nous les partageons, et les droits dont vous disposez. Elle couvre l’ensemble du site — pages du studio, formulaire de contact et boutique.",
      ],

      ["h2", "Responsable du traitement"],
      [
        "p",
        `Studio Abîme, ${TODO.address}, numéro d’entreprise ${TODO.bce}, est responsable du traitement de vos données personnelles au sens du RGPD. Pour toute question, écrivez à ${TODO.email}.`,
      ],

      ["h2", "Les données que nous traitons"],
      [
        "p",
        "Selon la façon dont vous utilisez le site, nous pouvons traiter :",
      ],
      [
        "li",
        "Données de contact — nom, adresse e-mail, numéro de téléphone, adresses de facturation et de livraison.",
      ],
      [
        "li",
        "Contenu de vos demandes — ce que vous écrivez dans le formulaire de contact : description de votre projet, phase, moyens, disponibilités.",
      ],
      [
        "li",
        "Données de commande — articles commandés, montants, historique, retours et échanges éventuels.",
      ],
      [
        "li",
        "Données de paiement — traitées directement par le prestataire de paiement de la boutique. Nous ne voyons ni ne conservons vos numéros de carte.",
      ],
      [
        "li",
        "Données techniques — adresse IP, type de navigateur et d’appareil, pages consultées, dates de visite.",
      ],

      ["h2", "D’où viennent ces données"],
      [
        "li",
        "De vous, lorsque vous remplissez le formulaire de contact, passez commande ou nous écrivez.",
      ],
      [
        "li",
        "De votre navigateur, automatiquement, lorsque vous consultez le site.",
      ],
      [
        "li",
        "De nos prestataires, lorsqu’ils traitent des données pour notre compte — notamment Shopify pour les commandes.",
      ],

      ["h2", "Pourquoi nous les traitons, et sur quelle base"],
      [
        "li",
        "Traiter et livrer vos commandes, gérer les retours — exécution du contrat qui nous lie.",
      ],
      [
        "li",
        "Répondre à une demande envoyée via le formulaire de contact — mesures précontractuelles prises à votre demande.",
      ],
      [
        "li",
        "Respecter nos obligations comptables et fiscales — obligation légale.",
      ],
      [
        "li",
        "Assurer la sécurité du site et prévenir la fraude — notre intérêt légitime à protéger notre activité et nos clients.",
      ],
      [
        "li",
        "Vous envoyer des nouvelles du studio, si vous vous y êtes inscrit — votre consentement, révocable à tout moment.",
      ],

      ["h2", "Qui a accès à vos données"],
      [
        "p",
        "Nous ne vendons pas vos données personnelles et ne les échangeons pas à des fins publicitaires. Nous faisons appel à des prestataires qui les traitent pour notre compte, sur instruction et dans le cadre d’un contrat de sous-traitance :",
      ],
      [
        "li",
        "Shopify International Ltd (Irlande) — boutique, paiement, gestion des commandes et de l’expédition.",
      ],
      ["li", "Sanity AS (Norvège) — hébergement du contenu éditorial du site."],
      [
        "li",
        "Resend — acheminement des e-mails envoyés depuis le formulaire de contact.",
      ],
      ["p", `Hébergement du site : ${TODO.host}`],
      [
        "p",
        "Nous pouvons également communiquer des données lorsque la loi l’exige, notamment en réponse à une demande d’une autorité compétente, ou pour établir et défendre nos droits en justice.",
      ],
      [
        "p",
        "Shopify traite par ailleurs certaines données pour ses propres besoins, en qualité de responsable du traitement. Sa politique est consultable sur [shopify.com](https://www.shopify.com/legal/privacy/app-users), et vous pouvez exercer vos droits auprès de Shopify via [privacy.shopify.com](https://privacy.shopify.com/fr).",
      ],

      ["h2", "Transferts hors de l’Union européenne"],
      [
        "p",
        "Certains de nos prestataires traitent des données en dehors de l’Espace économique européen. Ces transferts s’appuient sur les clauses contractuelles types de la Commission européenne, ou sur une décision d’adéquation lorsque le pays destinataire en bénéficie.",
      ],

      ["h2", "Combien de temps nous les conservons"],
      [
        "li",
        "Données de commande et pièces comptables — 7 ans, durée imposée par la législation comptable belge.",
      ],
      [
        "li",
        "Demandes envoyées via le formulaire de contact — 3 ans à compter du dernier échange.",
      ],
      ["li", "Journaux techniques du serveur — 12 mois."],
      [
        "li",
        "Inscription aux nouvelles du studio — jusqu’à votre désinscription.",
      ],

      ["h2", "Vos droits"],
      [
        "p",
        "Vous disposez du droit d’accéder à vos données, de les faire rectifier, de demander leur effacement, de limiter ou de vous opposer à leur traitement, d’en recevoir une copie transférable, et de retirer votre consentement lorsque le traitement repose sur celui-ci.",
      ],
      [
        "p",
        `Pour exercer ces droits, écrivez-nous à ${TODO.email}. Nous pourrons vous demander de justifier votre identité avant de répondre, et nous vous répondrons dans le mois.`,
      ],
      [
        "p",
        "Si notre réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de l’Autorité de protection des données, Rue de la Presse 35, 1000 Bruxelles — [autoriteprotectiondonnees.be](https://www.autoriteprotectiondonnees.be).",
      ],

      ["h2", "Cookies"],
      [
        "p",
        "Le site n’utilise que des cookies nécessaires à son fonctionnement. Le détail figure dans notre politique cookies.",
      ],

      ["h2", "Sécurité"],
      [
        "p",
        "Le site est servi en HTTPS et l’accès aux outils de gestion est restreint. Aucune mesure n’étant infaillible, nous vous invitons à ne pas nous transmettre d’informations sensibles par des canaux non sécurisés.",
      ],

      ["h2", "Mineurs"],
      [
        "p",
        "Les Services ne s’adressent pas aux enfants et nous ne collectons pas sciemment de données les concernant. Si vous êtes titulaire de l’autorité parentale et pensez que votre enfant nous a transmis des données, écrivez-nous : nous les supprimerons.",
      ],

      ["h2", "Modifications"],
      [
        "p",
        "Cette politique peut évoluer, notamment si nos outils ou nos pratiques changent. La version en vigueur est celle publiée sur cette page, et sa date de mise à jour figure en tête.",
      ],
    ],
  }),

  legalPage({
    id: "page-legal-cookies",
    title: "Politique cookies",
    description:
      "Les cookies déposés par le site Studio Abîme, leur rôle, et comment les contrôler depuis votre navigateur.",
    body: [
      ["p", "[À COMPLÉTER : date de dernière mise à jour]"],
      [
        "p",
        "Un cookie est un petit fichier déposé sur votre appareil lorsque vous consultez un site. Il permet notamment de garder en mémoire ce que vous y faites d’une page à l’autre.",
      ],

      ["h2", "Les cookies que nous déposons"],
      [
        "p",
        "Ce site n’utilise que des cookies strictement nécessaires à son fonctionnement. Ils servent à :",
      ],
      [
        "li",
        "garder votre panier d’une page à l’autre et jusqu’à votre retour ;",
      ],
      ["li", "maintenir votre session pendant la navigation ;"],
      ["li", "assurer la sécurité des échanges avec la boutique."],
      [
        "p",
        "Ces cookies sont indispensables au service que vous demandez. Le droit européen n’exige pas votre consentement préalable pour ce type de cookies, mais il impose de vous en informer — c’est l’objet de cette page.",
      ],

      ["h2", "Ce que nous ne faisons pas"],
      [
        "p",
        "À ce jour, ce site ne dépose aucun cookie publicitaire, aucun pixel de réseau social et aucun outil de mesure d’audience. Nous ne suivons pas votre navigation en dehors de ce site et ne construisons aucun profil publicitaire.",
      ],

      ["h2", "Pendant le paiement"],
      [
        "p",
        "Le paiement s’effectue sur l’infrastructure de Shopify, qui dépose ses propres cookies nécessaires à la sécurité de la transaction et à la prévention de la fraude. Leur détail relève de la politique de Shopify.",
      ],

      ["h2", "Contrôler les cookies"],
      [
        "p",
        "Vous pouvez à tout moment consulter, bloquer ou supprimer les cookies depuis les réglages de votre navigateur. Bloquer les cookies nécessaires empêche cependant le panier et le paiement de fonctionner.",
      ],

      ["h2", "Si cela change"],
      [
        "p",
        "Le jour où nous ajouterons un outil de mesure d’audience ou de publicité, cette page sera mise à jour et un bandeau vous demandera votre consentement avant tout dépôt — que vous resterez libre de refuser.",
      ],
    ],
  }),
];

/* ── Écriture ────────────────────────────────────────────────────────────── */

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const results = await Promise.all(
  pages.map(async ({ label, doc }) => {
    const published = doc._id.replace(/^drafts\./, "");

    /*
      On vérifie les DEUX formes du document. Un brouillon déjà relu ne doit pas
      être écrasé, et une page déjà publiée encore moins.
    */
    const existing = await client.fetch("*[_id in $ids][0]._id", {
      ids: [doc._id, published],
    });

    if (existing) {
      skip(`${label} — déjà présent (${existing}), inchangé.`);
      return false;
    }

    await client.create(doc);
    ok(`${label} — brouillon créé.`);
    return true;
  }),
).catch((error) => {
  ko(`Échec de l’écriture : ${error.message}`);
  process.exit(1);
});

const created = results.filter(Boolean).length;

console.log(
  created > 0
    ? `\n  ${created} brouillon(s) créé(s) dans le dataset « ${dataset} ».\n\n` +
        "  Prochaines étapes, dans le Studio :\n" +
        "    1. rechercher « [À COMPLÉTER » dans chaque page et remplir les trous ;\n" +
        "    2. relire — ces textes vous engagent ;\n" +
        "    3. publier. Le lien apparaît alors dans le pied de page.\n"
    : "\n  Rien à créer : les trois pages existent déjà.\n",
);
