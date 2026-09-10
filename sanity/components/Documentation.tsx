import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  Container,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from "@sanity/ui";

/**
 * Mode d'emploi du back-office, affiché dans une entrée de la structure.
 *
 * Écrit en code et non saisi dans le CMS : c'est une notice, pas du contenu.
 * Elle ne doit ni pouvoir être modifiée par erreur, ni disparaître si le
 * dataset est réinitialisé — et elle suit les évolutions du site dans le même
 * commit que le changement qu'elle décrit.
 *
 * Deux onglets parce que le site se pilote depuis deux back-offices : celui-ci
 * pour l'éditorial, Shopify pour la boutique. Les réunir dans une même page
 * évite d'avoir à retrouver un PDF qui traîne quelque part, et garantit que la
 * notice de la boutique vieillit au même rythme que le code qui la lit.
 */

/** Adresse de contact affichée en bas de la notice. */
const CONTACT = "hello@isaure-lohest.com";

/** Admin de la boutique. À reprendre le jour où la boutique change de domaine. */
const ADMIN_SHOPIFY = "https://studio-abime-qm0ief9y.myshopify.com/admin";

interface Point {
  titre: string;
  texte: string;
  /** Énumération, quand le point décrit une liste de champs plutôt qu'une règle. */
  liste?: Array<{ terme: string; texte: string }>;
}

interface Chapitre {
  titre: string;
  chapeau?: string;
  ton: "primary" | "caution" | "critical" | "default";
  points: Point[];
}

interface Onglet {
  id: string;
  titre: string;
  chapeau: string;
  chapitres: Chapitre[];
}

/* ── Onglet 1 : le back-office éditorial ─────────────────────────────────── */

const SANITY: Chapitre[] = [
  {
    titre: "Les bases",
    ton: "primary",
    points: [
      {
        titre: "Brouillon et publication",
        texte:
          "Rien n’apparaît sur le site avant d’être publié. Tant que la pastille « Draft » est allumée, les modifications sont enregistrées mais restent privées ; utiliser le bouton Publish, en bas de l’écran, pour les mettre en ligne.",
      },
      {
        titre: "Le sélecteur « Drafts / Published », tout en haut",
        texte:
          "Il choisit la version affichée par le Studio. Le conserver sur « Drafts » : c’est la position de travail, la seule où écrire. Sur « Published », le site apparaît tel qu’il est en ligne et les champs se figent — si plus rien ne réagit, vérifier ce sélecteur en premier.",
      },
      {
        titre: "Voir avant de publier",
        texte:
          "L’onglet Presentation affiche le site à côté du formulaire. Cliquer sur un texte dans la page pour l’ouvrir à gauche ; le modifier pour mettre la page à jour en direct.",
      },
      {
        titre: "Les images",
        texte:
          "Les images conservent leur cadrage d’origine lorsque leur cadre reprend le même ratio. Si le site les place dans un cadre d’un autre format, il les recadre : choisir alors un point focal pour garder la zone importante visible. Le « texte alternatif » sert à décrire l’image pour les personnes qui ne la voient pas et pour les moteurs de recherche — une phrase suffit.",
      },
      {
        titre: "L’onglet SEO",
        texte:
          "Chaque contenu concerné possède un titre et une description pour Google et les réseaux. Laissés vides, le site reprend son titre habituel et, selon le type de contenu, d’abord son extrait ou son introduction. Si aucun texte propre n’est disponible, il utilise la description générale de Réglages du site → Textes et SEO.",
      },
      {
        titre: "L’adresse d’un projet ou d’un article",
        texte:
          "Pour les projets et les articles du Journal, l’adresse se forme à partir du titre à la première publication, puis ne bouge plus. Corriger une coquille ne doit pas déplacer un contenu dont l’adresse circule déjà. Pour la changer malgré tout, la modifier dans l’onglet SEO ; à la publication, le Studio propose de rediriger l’ancienne adresse vers la nouvelle. Accepter, sauf si l’ancienne adresse n’a jamais été utilisée.",
      },
    ],
  },
  {
    titre: "Ce qui se gère ici",
    ton: "default",
    points: [
      {
        titre: "Pages",
        texte:
          "Une entrée par page du site. Modifier ici les textes et les images ; l’emplacement de la page et l’ordre de ses blocs sont fixés. C’est voulu : aucune modification effectuée ici ne peut casser une page.",
      },
      {
        titre: "Projets",
        texte:
          "Le portfolio. Chaque fiche porte son visuel, ses informations et son texte. La case « Projet favori » compte ailleurs : les favoris alimentent la table des éléments de la page Expériences, la sélection de l’accueil et l’archive du Labo.",
      },
      {
        titre: "Clients",
        texte:
          "La liste des références. Son ordre compte : c’est lui qui remplit les cases de la table des éléments, sur la page Expériences.",
      },
      {
        titre: "Étoiles",
        texte:
          "Les personnes qui travaillent avec le studio : un nom, un rôle. Elles se rassemblent en constellation autour de Studio Abîme, en bas de la page Labo — automatiquement, toutes celles qui sont encodées. L’interrupteur « Dans la constellation du Labo » en retire une sans supprimer sa fiche. Dans un projet, le champ « Constellation » de la fiche désigne qui y a pris part : leur constellation se compose en clôture de la page. La place de chacune est calculée, jamais saisie — et elle change à chaque visite.",
      },
      {
        titre: "Journal",
        texte:
          "Les articles, classés en deux rubriques : Cahier de recherche et Actualités.",
      },
      {
        titre: "Réglages du site",
        texte:
          "Le nom du site, sa description par défaut, son image sociale, la page servie à la racine, et les liens vers les réseaux sociaux.",
      },
      {
        titre: "Mentions légales, confidentialité, cookies",
        texte:
          "Ces trois pages décrivent l’entreprise et non la boutique : elles s’écrivent ici, dans Pages, sous le trait de séparation.",
      },
    ],
  },
  {
    titre: "Ce qui se gère dans Shopify",
    chapeau:
      "Rien de ce qui suit ne s’écrit ici : le site le lit directement chez Shopify. Le détail est dans l’onglet « La boutique ».",
    ton: "caution",
    points: [
      {
        titre: "Les produits et les collections",
        texte:
          "Nom, description, photos, prix, variantes, stock, et le rangement dans les trois collections. Un produit épuisé ou dépublié dans Shopify disparaît du site de lui-même.",
      },
      {
        titre: "CGV, Livraison, Retours et remboursements",
        texte:
          "Ces trois pages s’écrivent dans l’admin Shopify, sous Paramètres → Politiques.",
      },
      {
        titre: "Commandes et paiements",
        texte:
          "Commandes, clients de la boutique, expéditions, moyens de paiement, taxes et frais de port.",
      },
    ],
  },
  {
    titre: "Ce qui n’est ni dans l’un ni dans l’autre",
    chapeau:
      "Certaines choses sont fixées dans le code du site : ce sont des décisions de conception, pas du contenu.",
    ton: "default",
    points: [
      {
        titre: "La navigation et les intitulés de section",
        texte:
          "Le menu principal, les numéros de section (01. Le Labo, 02. Expériences…) et les titres des pages d’index.",
      },
      {
        titre: "La mise en page",
        texte:
          "Typographie, couleurs, tailles, marges, animations : le back-office porte le contenu, jamais la forme.",
      },
      {
        titre: "Les rubriques du Journal",
        texte:
          "Cahier de recherche et Actualités sont fixées — choisir librement la rubrique de chaque article.",
      },
      {
        titre: "Les libellés des boutons de la boutique",
        texte:
          "« J’investis dans une vision », « dans un outil », « dans mes connaissances » : chaque famille de produits a le sien. Rien à saisir dans Shopify.",
      },
    ],
  },
];

/* ── Onglet 2 : la boutique ──────────────────────────────────────────────── */

const SHOPIFY: Chapitre[] = [
  {
    titre: "00. Accès",
    ton: "primary",
    points: [
      {
        titre: "Où se connecter",
        texte: `Tout se pilote depuis l’admin Shopify : ${ADMIN_SHOPIFY}. C’est un back-office séparé de celui-ci, avec ses propres identifiants.`,
      },
      {
        titre: "Le site n’est pas un thème Shopify",
        texte:
          "Shopify tient le catalogue, les paiements et les commandes ; le site va les chercher et les affiche à sa manière. Conséquence pratique : la section « Boutique en ligne → Thèmes » ne sert à rien ici — ce qu’on y modifie n’a aucun effet sur le site.",
      },
      {
        titre: "Le délai d’affichage",
        texte:
          "Les prix, le stock et la disponibilité sont lus en direct. Le reste — un produit ajouté, un texte modifié, une photo changée — apparaît à la reconstruction suivante du site. Prévoir quelques minutes, pas l’instantané.",
      },
    ],
  },
  {
    titre: "01. Créer et ranger un produit",
    chapeau:
      "C’est la saisie la plus importante de toute la boutique. Un seul champ, « Type de produit », décide de trois choses à la fois : la collection dans laquelle le produit se range, le libellé de son bouton d’achat, et les informations affichées sur sa fiche.",
    ton: "default",
    points: [
      {
        titre: "Pour gagner du temps : dupliquer",
        texte:
          "Pour créer un produit proche d’un produit existant, utiliser l’action « Dupliquer » depuis sa fiche plutôt que de repartir de zéro. Choisir un produit de la même famille comme modèle, puis vérifier systématiquement le titre, la description, les médias, le prix, le stock, les variantes et les informations complémentaires. Garder la copie en brouillon jusqu’à ce que tout soit relu.",
      },
      {
        titre: "Où le renseigner",
        texte:
          "Dans la fiche produit, colonne de droite, carte « Organisation du produit », champ « Type de produit ».",
      },
      {
        titre: "Les trois valeurs, à écrire exactement ainsi",
        texte:
          "La comparaison est littérale : une minuscule à la place d’une majuscule, un espace en trop, et le produit ne rejoint pas sa collection.",
        liste: [
          {
            terme: "Transmission",
            texte:
              "Ce qui se transmet — formations, ateliers et livres qui transmettent un savoir, une pratique ou une démarche.",
          },
          {
            terme: "Contemplation",
            texte:
              "Ce qui se contemple — tirages, cartes postales et livres envisagés avant tout comme des œuvres ou des objets à regarder.",
          },
          {
            terme: "Outil",
            texte: "Ce qui s’utilise — carnets, jeux de cartes.",
          },
        ],
      },
      {
        titre: "Si un produit n’apparaît nulle part",
        texte:
          "Neuf fois sur dix, c’est ce champ. Le relire caractère par caractère avant de chercher ailleurs. Un produit sans famille reste vendable, mais il n’entre dans aucune collection, garde le bouton générique « Ajouter au panier » et n’affiche aucune de ses informations complémentaires.",
      },
      {
        titre: "À ne pas confondre avec « Catégorie »",
        texte:
          "Juste au-dessus se trouve un champ « Catégorie », avec une liste toute faite venue de Shopify. Il aide Shopify à comprendre la nature du produit et contribue notamment à la fiscalité ainsi qu’à la compatibilité avec certains canaux de vente. Ce n’est pas lui qui range le produit dans les collections du site.",
      },
    ],
  },
  {
    titre: "02. Les collections",
    chapeau:
      "Les trois collections du site — Ce qui se transmet, Ce qui se contemple, Ce qui s’utilise — ramassent chacune les produits dont le « Type de produit » correspond, sans intervention.",
    ton: "default",
    points: [
      {
        titre: "Ne jamais ajouter un produit à la main",
        texte:
          "Une collection automatisée n’accepte pas d’ajout manuel, et il n’y a rien à y faire : renseigner le type sur la fiche produit, la collection suit. Un nouveau produit s’y range de lui-même, aujourd’hui comme dans deux ans.",
      },
      {
        titre: "Le temps de recalcul",
        texte:
          "Après avoir renseigné ou corrigé un type, la mise à jour de la collection peut prendre quelques instants. Si le produit n’y apparaît pas immédiatement, attendre puis actualiser avant de conclure à une erreur.",
      },
      {
        titre: "Modifier l’ordre des produits au sein d'une collection",
        texte:
          "Ouvrir Produits → Collections, puis la collection concernée. Dans « Collection items » — les produits de la collection — ouvrir « Default sort » et choisir le tri souhaité : manuellement, par date d’ajout, par ordre alphabétique, par prix, etc. Pour composer un ordre précis, choisir « Manuellement », puis déplacer les produits. Cela change uniquement leur ordre d’affichage ; leur ajout à la collection reste automatique.",
      },
      {
        titre: "Modifier la présentation d’une collection",
        texte:
          "Dans Produits → Collections, ouvrir la collection concernée pour modifier directement son titre, son image et sa description. Le titre est repris dans le menu, sur la page Shop et sur la page de la collection. L’image apparaît sur la page Shop. La description apparaît sur la page Shop et la page de la collection. Ne pas modifier les conditions et l’adresse de la collection (voir « À éviter »).",
      },
    ],
  },
  {
    titre: "03. Les informations complémentaires",
    chapeau:
      "Shopify les appelle « metafields ». Ce sont les champs sur mesure, tout en bas de la fiche produit, sous la description et les variantes. Ils alimentent la petite fiche technique affichée sur le site.",
    ton: "default",
    points: [
      {
        titre: "Tous les champs apparaissent sur toutes les fiches",
        texte:
          "C’est une limite de Shopify, pas un oubli : l’admin ne sait pas masquer un champ selon la famille du produit. « Prérequis » apparaît donc aussi sur un tirage — ne pas le remplir. Le site n’affiche que les champs de la famille du produit : ce qui est saisi ailleurs ne casse rien, c’est juste du travail perdu.",
      },
      {
        titre: "Sur tous les produits",
        texte: "Ces deux-là valent pour les trois familles.",
        liste: [
          {
            terme: "Origine de production",
            texte:
              "Qui l’a fabriqué, quand l’objet vient d’ailleurs. C’est ce champ qui porte le « ce qu’on relaie » : il n’a pas sa collection, il s’affiche sur la fiche.",
          },
          {
            terme: "Afficher la jauge",
            texte:
              "Coché, la fiche affiche à côté du prix le stock restant lu dans Shopify. Décoché, elle ne montre aucun nombre, mais le stock continue de limiter les achats.",
          },
        ],
      },
      {
        titre: "Sur les produits de type Transmission seulement",
        texte:
          "Ceux-ci ne s’affichent que sur un produit de type Transmission.",
        liste: [
          {
            terme: "État",
            texte:
              "Pour les livres, choisir entre Neuf et Seconde main. Une fois rempli, ce champ s’affiche sur la fiche et le stock s’accorde en « exemplaire restant » ou « exemplaires restants ». Le laisser vide sur une formation : la ligne « État » n’apparaît pas et le site parle de places restantes.",
          },
          {
            terme: "Date & heure",
            texte:
              "Pour une formation à session unique, remplir ce metafield pour afficher la date et l’heure sur la fiche. Lorsqu’un produit comporte plusieurs variantes « Session », laisser ce metafield vide : il appartient au produit et sa valeur serait donc la même pour toutes les variantes. Indiquer directement la date et l’heure dans le nom de chaque variante.",
          },
          {
            terme: "Lieu",
            texte:
              "Indiquer « En ligne », une adresse ou une ville. Pour plusieurs sessions d’une même formation, utiliser des variantes seulement si le lieu reste identique ; sinon, créer des produits séparés.",
          },
          {
            terme: "Durée",
            texte:
              "Indiquer la durée commune de la formation. Si elle varie selon les sessions, créer des produits séparés plutôt que des variantes.",
          },
          {
            terme: "Prérequis",
            texte: "Ce qu’il faut savoir ou avoir avant de venir.",
          },
          {
            terme: "Compétences que ça apporte",
            texte: "Ce qu’on emporte en partant.",
          },
          {
            terme: "Ce que tu en fais après",
            texte: "L’usage concret, une fois la formation finie.",
          },
          {
            terme: "Collaborateurs",
            texte: "Les personnes qui interviennent dans la formation.",
          },
        ],
      },
      {
        titre: "Sur les produits de type Outil seulement",
        texte: "Un seul champ, mais il compte.",
        liste: [
          {
            terme: "Catégorie",
            texte: "Outil de com, Esthétique, Réflexion, Structure.",
          },
        ],
      },
      {
        titre: "Ne pas créer de nouveau champ sans prévenir",
        texte:
          "Un champ créé ici n’apparaît pas sur le site pour autant : il faut d’abord apprendre au site à le lire. Prévenir avant de le créer, c’est l’affaire de quelques minutes.",
      },
    ],
  },
  {
    titre: "04. Les variantes",
    chapeau:
      "Une variante est une version achetable d’un même produit : par exemple, chaque format d’un tirage ou chaque session d’une formation.",
    ton: "default",
    points: [
      {
        titre: "Choisir entre variantes et produits séparés",
        texte:
          "Utiliser des variantes lorsque l’offre reste fondamentalement la même. Pour une formation, conserver dans un seul produit des sessions dont le programme, les prérequis, les compétences, l’usage après la formation, le lieu, la durée et les collaborateurs sont identiques. Si l’une de ces informations change, créer des produits séparés. Pour chaque variante « Session », renseigner individuellement son nom — avec sa date et son heure —, son prix, son stock et son image.",
      },
      {
        titre: "Ce qui reste commun à toutes les variantes",
        texte:
          "Le titre, la description, la galerie générale et tous les metafields renseignés sur la fiche produit restent communs. Le metafield « Date & heure » ne peut donc pas recevoir une valeur différente pour chaque session : le laisser vide et placer ces informations dans le nom de chaque variante.",
      },
      {
        titre: "Ce qui peut changer pour chaque variante",
        texte:
          "Renseigner séparément le nom de la variante, son prix, son éventuel prix barré, sa référence, son stock et une image associée. Shopify permet bien d’associer une image à chaque variante ; sur le site actuel, cette image peut servir dans le panier, mais choisir une variante ne remplace pas automatiquement le visuel principal de la fiche produit.",
      },
      {
        titre: "Comment les créer",
        texte:
          "Dans la fiche produit, section Variantes : donner un nom à l’axe (« Format », « Session »), puis saisir ses valeurs. Chaque combinaison devient une ligne, avec son prix et son stock propres.",
      },
      {
        titre: "Un produit proposé en une seule version",
        texte:
          "Ne créer aucune variante pour un produit proposé en une seule version. Renseigner simplement son prix et son stock sur la fiche produit.",
      },
      {
        titre: "Un tirage",
        texte:
          "L’axe s’appelle Format, ses valeurs sont les formats de papier. Chaque format a son prix : le site affiche « à partir de » dans la grille, et le prix exact dès qu’on choisit.",
      },
      {
        titre: "Une formation à session unique",
        texte:
          "Ne créer aucune variante : remplir « Date & heure », puis le lieu, la durée, les prérequis, les compétences et l’usage après la formation. Renseigner également le prix et le stock de la formation.",
      },
      {
        titre: "Une formation avec plusieurs sessions",
        texte:
          "Créer un axe « Session » et une variante par date. Indiquer la date et l’heure directement dans le nom de chaque variante, avec un libellé autonome comme « 15 octobre 2026 · 9 h–17 h ». Ne pas remplir le metafield produit « Date & heure » : il est commun à toutes les variantes. Renseigner une seule fois les autres informations communes de la formation. Si l’une d’elles doit varier entre deux sessions, créer deux produits plutôt que deux variantes.",
      },
    ],
  },
  {
    titre: "05. Le stock restant",
    chapeau:
      "Un seul chiffre fait foi : l’inventaire réel de chaque variante dans Shopify. Il diminue automatiquement après chaque vente.",
    ton: "default",
    points: [
      {
        titre: "Renseigner le stock",
        texte:
          "Pour un produit disponible en quantité limitée, ouvrir la section Inventaire de chaque variante, cocher « Suivre la quantité » et saisir la quantité disponible. Pour une formation, ce nombre correspond aux places encore ouvertes ; pour un objet, aux exemplaires encore disponibles. Pour un produit sans limite de quantité, comme un fichier envoyé par e-mail, laisser le suivi désactivé : il reste achetable sans afficher de faux stock.",
      },
      {
        titre: "Afficher ou masquer le nombre restant",
        texte:
          "Cocher le metafield « Afficher la jauge » pour montrer le stock restant à côté du prix. Le laisser décoché pour masquer ce nombre. Cette jauge ne concerne que les produits dont l’inventaire est suivi. Le site retire un produit lorsque toutes ses variantes suivies sont épuisées. Pour garder le comportement de Shopify cohérent avec le site, laisser désactivée l’option « Continuer à vendre en cas de rupture de stock ».",
      },
      {
        titre: "Un stock par variante",
        texte:
          "Renseigner chaque variante séparément : un format A2 peut avoir un autre stock qu’un A4, et une session de mars un autre nombre de places qu’une session de juin.",
      },
      {
        titre: "Une formation n’est pas un objet",
        texte:
          "Dans sa fiche, décocher « Ceci est un produit physique » — sinon Shopify réclame un poids et applique des frais de port à une inscription. Activer également le suivi du stock : c’est lui qui ferme les inscriptions quand la session est pleine.",
      },
    ],
  },
  {
    titre: "06. Publier, masquer, retirer",
    chapeau:
      "Six situations, du statut courant à la suppression définitive. Toujours choisir l’action la plus douce qui fasse l’affaire.",
    ton: "default",
    points: [
      {
        titre: "Actif",
        texte:
          "« Actif » ne signifie pas à lui seul « en ligne ». Pour rendre le produit visible sur le site, cumuler ces trois conditions :",
        liste: [
          {
            terme: "Statut",
            texte: "passer le produit en Actif.",
          },
          {
            terme: "Canal de vente",
            texte: "publier le produit sur « Studio Abîme Headless ».",
          },
          {
            terme: "Marché et catalogue",
            texte: "rendre le produit disponible dans le marché et le catalogue concernés.",
          },
        ],
      },
      {
        titre: "Brouillon",
        texte:
          "Le produit disparaît du site mais reste entier dans l’admin, avec ses photos, ses prix et ses réglages. C’est le bon geste pour retirer temporairement quelque chose, ou préparer un produit avant sa sortie.",
      },
      {
        titre: "Épuisé",
        texte:
          "Pour un produit dont l’inventaire est suivi, lorsqu’aucune variante n’a encore de stock, le produit disparaît automatiquement de la boutique, des collections, des suggestions et de sa propre adresse. Le site applique cette règle même si « Continuer à vendre en cas de rupture de stock » est activé dans Shopify. Un produit dont l’inventaire n’est pas suivi reste disponible, même si Shopify renvoie une quantité égale à zéro. Remettre du stock le fait réapparaître après la prochaine mise à jour du site.",
      },
      {
        titre: "Archiver un produit",
        texte:
          "Archiver un produit pour le sortir de la liste tout en le conservant dans Shopify. Il reste possible de le réactiver plus tard.",
      },
      {
        titre: "Supprimer un produit",
        texte:
          "Supprimer un produit est définitif : sa fiche, ses variantes et ses médias ne peuvent pas être restaurés. Les anciennes commandes restent consultables, mais elles perdent leur lien vers la fiche produit. Préférer l’archivage.",
      },
      {
        titre: "Le canal de vente",
        texte:
          "Dans la carte « Publication » de la fiche, vérifier que « Studio Abîme Headless » est sélectionné. L’API Storefront ne retourne que les produits publiés sur le canal qui l’interroge : s’il est décoché, le produit reste invisible sur le site, même avec le statut Actif. Vérifier également sa disponibilité dans le marché et le catalogue concernés. Le canal « Online Store » concerne le thème Shopify et n’est pas nécessaire pour ce site headless.",
      },
    ],
  },
  {
    titre: "07. Les pages CGV, Livraison, Retours",
    ton: "default",
    points: [
      {
        titre: "Où les écrire",
        texte:
          "Admin Shopify → Paramètres → Politiques. Ces trois textes servent à la fois au tunnel de paiement et aux pages du site : une seule source à maintenir. Après une modification, attendre la reconstruction suivante du site pour voir la nouvelle version sur les pages headless.",
      },
      {
        titre: "Ils n’ont pas de brouillon",
        texte:
          "Contrairement à un produit, une politique n’a pas de statut Brouillon. L’enregistrer met sa nouvelle version à disposition de Shopify ; la page du site headless l’affiche après la reconstruction suivante. Relire avant d’enregistrer.",
      },
      {
        titre: "Une politique vide n’a pas de page",
        texte:
          "Tant qu’un de ces textes n’est pas écrit, le site ne publie pas la page correspondante et n’y renvoie pas. Après avoir rempli ou vidé une politique, attendre la reconstruction suivante pour voir la page apparaître ou disparaître. Rien à désactiver.",
      },
    ],
  },
  {
    titre: "08. Commandes et clients",
    ton: "default",
    points: [
      {
        titre: "Tout se passe dans Shopify",
        texte:
          "Le site ne fait que conduire au paiement : il ne conserve ni commande, ni client.",
      },
      {
        titre: "Une commande d’inscription",
        texte:
          "Une formation vendue arrive comme n’importe quelle commande. Lire la date choisie dans le nom de la variante correspondant à la session achetée.",
      },
    ],
  },
  {
    titre: "09. Remboursements",
    chapeau:
      "Toujours partir de la commande concernée dans Shopify : le site ne rembourse rien lui-même.",
    ton: "default",
    points: [
      {
        titre: "Rembourser tout ou partie d’une commande",
        texte:
          "Ouvrir Commandes, choisir la commande concernée, puis cliquer sur « Rembourser » (Refund). Sélectionner les articles et les quantités à rembourser, ou saisir un montant partiel. Ajouter les frais de livraison si nécessaire, décider si les articles ou les places doivent revenir dans le stock, puis choisir l’envoi ou non d’une notification au client. Vérifier le récapitulatif avant de confirmer.",
      },
      {
        titre: "Choisir le réapprovisionnement avec attention",
        texte:
          "Remettre dans le stock uniquement ce qui peut être vendu à nouveau : un exemplaire réellement retourné, ou une place libérée après l’annulation d’une inscription. Ne pas réapprovisionner un article perdu, endommagé ou définitivement consommé.",
      },
      {
        titre: "Un remboursement ne s’annule pas",
        texte:
          "Relire le montant et le moyen de remboursement avant de valider. Une fois lancé dans Shopify, un remboursement ne peut être ni annulé ni inversé. Selon les options disponibles dans la boutique, rembourser vers le moyen de paiement d’origine, le crédit boutique, ou les deux.",
      },
      {
        titre: "Appliquer une réduction à une commande existante",
        texte:
          "Tant que la commande et les lignes concernées restent modifiables, ouvrir la commande, cliquer sur « Modifier » (Edit), puis sur le prix de l’article concerné. Appliquer la réduction manuelle aux lignes précises à corriger, ajouter éventuellement une raison, puis vérifier et mettre à jour la commande. Une commande ou une ligne déjà traitée ne peut pas toujours être modifiée ; vérifier les actions proposées par Shopify avant de promettre l’ajustement. Il est aussi possible d’ajouter une réduction à un article depuis l’écran de remboursement lorsque cette option est disponible.",
      },
      {
        titre: "Rembourser la différence après une réduction",
        texte:
          "Si la réduction diminue une commande déjà payée, mettre à jour la commande ne renvoie pas automatiquement l’argent. Effectuer ensuite le remboursement de la différence depuis cette même commande.",
      },
    ],
  },
  {
    titre: "10. Réductions",
    chapeau:
      "Pour préparer une offre destinée à de futures commandes, ouvrir Réductions (Discounts), puis choisir « Créer une réduction ». Elle s’applique au panier ou au paiement ; elle ne modifie pas une commande déjà passée et ne constitue pas un remboursement.",
    ton: "default",
    points: [
      {
        titre: "Configurer la réduction",
        texte:
          "Définir son type, son mode d’application, le public concerné, ses conditions et sa durée avant de la rendre active.",
        liste: [
          {
            terme: "Choisir le type",
            texte:
              "Sélectionner une remise sur certains produits ou certaines collections, une offre « Acheter X, obtenir Y », une remise sur le montant total de la commande, ou la livraison gratuite. Selon le type choisi, indiquer un pourcentage, un montant fixe ou les articles offerts ou réduits.",
          },
          {
            terme: "Choisir la méthode",
            texte:
              "Créer un code de réduction lorsque la personne doit le saisir au paiement. Écrire un code lisible ou utiliser « Générer un code aléatoire ». Choisir une réduction automatique pour qu’elle s’applique seule dès que le panier remplit les conditions ; lui donner alors un titre compréhensible.",
          },
          {
            terme: "Cibler l’offre",
            texte:
              "L’ouvrir à toute la clientèle ou la réserver aux personnes éligibles, notamment à un ou plusieurs segments de clients. Selon la réduction, l’appliquer à toute la commande, à des produits précis ou à des collections entières.",
          },
          {
            terme: "Poser les conditions",
            texte:
              "Définir si nécessaire un montant minimal d’achat ou une quantité minimale d’articles. Pour un code, limiter éventuellement le nombre total d’utilisations et son usage à une fois par client.",
          },
          {
            terme: "Planifier la durée",
            texte:
              "Renseigner la date et l’heure de début, puis ajouter une date et une heure de fin lorsque l’offre est temporaire. Shopify utilise le fuseau horaire configuré pour la boutique.",
          },
          {
            terme: "Vérifier les combinaisons",
            texte:
              "Choisir si la réduction peut se cumuler avec des remises sur les produits, sur la commande ou sur la livraison. Toutes les combinaisons ne sont pas possibles : relire le récapitulatif et tester le panier avant de communiquer l’offre.",
          },
        ],
      },
    ],
  },
  {
    titre: "11. À éviter",
    chapeau:
      "Dans le doute, ne rien changer et demander. Ces quatre gestes-là cassent quelque chose de visible.",
    ton: "critical",
    points: [
      {
        titre: "Renommer l’adresse d’une collection ou d’un produit",
        texte:
          "Le « handle » est l’adresse de la page sur le site. Le modifier casse tous les liens existants — ceux déjà partagés, ceux présents dans une newsletter, ceux qu’a retenus Google.",
      },
      {
        titre: "Changer les conditions d’une collection",
        texte:
          "Elles sont réglées sur les trois valeurs du « Type de produit ». Une condition modifiée, et une collection entière se vide.",
      },
      {
        titre: "Toucher au canal Headless",
        texte:
          "Dans Paramètres → Applications, l’entrée Headless est la porte par laquelle le site lit la boutique. La désinstaller ou régénérer ses jetons coupe le catalogue et le panier, immédiatement.",
      },
      {
        titre: "Supprimer un produit vendu",
        texte:
          "Les anciennes commandes restent consultables après la suppression, mais elles perdent leur lien vers la fiche produit. La fiche, ses variantes et ses médias ne peuvent pas être restaurés. Préférer l’archivage.",
      },
    ],
  },
];

const ONGLETS: Onglet[] = [
  {
    id: "sanity",
    titre: "Le back-office",
    chapeau:
      "Le site se pilote depuis deux endroits : ce back-office pour le contenu éditorial, et Shopify pour tout ce qui concerne la boutique. Cet onglet dit lequel fait quoi.",
    chapitres: SANITY,
  },
  {
    id: "shopify",
    titre: "La boutique",
    chapeau: "L'administration des produits se fait dans l’admin Shopify.",
    chapitres: SHOPIFY,
  },
];

function chapitreId(ongletId: string, index: number) {
  return `guide-${ongletId}-${index}`;
}

function titreSommaire(titre: string) {
  return titre.replace(/^\d+\.\s*/, "");
}

function numeroSommaire(titre: string, index: number) {
  return titre.match(/^(\d+)\./)?.[1] ?? String(index + 1).padStart(2, "0");
}

function Sommaire({
  onglet,
  sectionActive,
}: {
  onglet: Onglet;
  sectionActive: string;
}) {
  return (
    <nav
      className="documentation__toc"
      aria-label={`Sommaire — ${onglet.titre}`}
    >
      <div className="documentation__toc-inner">
        <Text
          as="h2"
          muted
          size={0}
          weight="semibold"
          style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Sommaire
        </Text>
        <ol className="documentation__toc-list">
          {onglet.chapitres.map((chapitre, index) => {
            const id = chapitreId(onglet.id, index);
            const courant = sectionActive === id;

            return (
              <li key={id} className={courant ? "is-active" : undefined}>
                <a
                  href={`#${id}`}
                  aria-current={courant ? "location" : undefined}
                >
                  <span aria-hidden="true">
                    {numeroSommaire(chapitre.titre, index)}
                  </span>
                  <span>{titreSommaire(chapitre.titre)}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function Chapitres({
  chapitres,
  ongletId,
}: {
  chapitres: Chapitre[];
  ongletId: string;
}) {
  return (
    <Stack gap={5}>
      {chapitres.map((chapitre, index) => (
        <section
          key={chapitre.titre}
          id={chapitreId(ongletId, index)}
          data-guide-section
          style={{ scrollMarginTop: "1rem" }}
        >
          <Card padding={4} radius={2} shadow={1} tone={chapitre.ton}>
            <Stack gap={4}>
              <Stack gap={3}>
                <Heading size={2}>{chapitre.titre}</Heading>
                {chapitre.chapeau && (
                  <Text muted size={1} style={{ lineHeight: 1.6 }}>
                    {chapitre.chapeau}
                  </Text>
                )}
              </Stack>

              {chapitre.points.map((point) => (
                <Stack key={point.titre} gap={2}>
                  <Text weight="semibold" size={1}>
                    {point.titre}
                  </Text>
                  <Text muted size={1} style={{ lineHeight: 1.6 }}>
                    {point.texte}
                  </Text>

                  {/*
                    Retrait à gauche plutôt que de vraies puces : la liste sert à
                    poser des couples « champ → ce qu'il contient », que l'œil
                    parcourt en diagonale. Un filet vertical suffit à les tenir
                    ensemble sans les déguiser en énumération de tâches.
                  */}
                  {point.liste && (
                    <Stack
                      gap={3}
                      marginTop={2}
                      paddingLeft={3}
                      style={{
                        borderLeft: "1px solid var(--card-border-color)",
                      }}
                    >
                      {point.liste.map((entree) => (
                        <Text
                          key={entree.terme}
                          muted
                          size={1}
                          style={{ lineHeight: 1.6 }}
                        >
                          <strong>{entree.terme}</strong> — {entree.texte}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </Card>
        </section>
      ))}
    </Stack>
  );
}

export default function Documentation() {
  const [actif, setActif] = useState(ONGLETS[0].id);
  const [sectionActive, setSectionActive] = useState(
    chapitreId(ONGLETS[0].id, 0),
  );
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const mettreAJour = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sections = Array.from(
          scroller.querySelectorAll<HTMLElement>(
            `#panneau-${actif} [data-guide-section]`,
          ),
        );
        if (sections.length === 0) return;

        const seuil = scroller.getBoundingClientRect().top + 24;
        let courante = sections[0];

        for (const section of sections) {
          if (section.getBoundingClientRect().top <= seuil) courante = section;
          else break;
        }

        if (
          scroller.scrollTop + scroller.clientHeight >=
          scroller.scrollHeight - 2
        ) {
          courante = sections[sections.length - 1];
        }

        setSectionActive((precedente) =>
          precedente === courante.id ? precedente : courante.id,
        );
      });
    };

    mettreAJour();
    scroller.addEventListener("scroll", mettreAJour, { passive: true });
    window.addEventListener("resize", mettreAJour);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", mettreAJour);
      window.removeEventListener("resize", mettreAJour);
    };
  }, [actif]);

  const changerOnglet = (ongletId: string) => {
    setActif(ongletId);
    setSectionActive(chapitreId(ongletId, 0));
  };

  return (
    <div ref={scrollerRef} className="documentation__scroller">
      <Box padding={4}>
        <Container width={2}>
          <Stack gap={5}>
            <Heading size={4}>Mode d’emploi</Heading>

            <TabList gap={2}>
              {ONGLETS.map((onglet) => (
                <Tab
                  key={onglet.id}
                  id={`onglet-${onglet.id}`}
                  aria-controls={`panneau-${onglet.id}`}
                  label={onglet.titre}
                  selected={actif === onglet.id}
                  onClick={() => changerOnglet(onglet.id)}
                />
              ))}
            </TabList>

            {ONGLETS.map((onglet) => (
              <TabPanel
                key={onglet.id}
                id={`panneau-${onglet.id}`}
                aria-labelledby={`onglet-${onglet.id}`}
                hidden={actif !== onglet.id}
              >
                <Stack gap={5}>
                  <Text muted size={2} style={{ lineHeight: 1.6 }}>
                    {onglet.chapeau}
                  </Text>
                  <div className="documentation__layout">
                    <Sommaire onglet={onglet} sectionActive={sectionActive} />
                    <div className="documentation__content">
                      <Chapitres
                        chapitres={onglet.chapitres}
                        ongletId={onglet.id}
                      />
                    </div>
                  </div>
                </Stack>
              </TabPanel>
            ))}

            <Card padding={4} radius={2} shadow={1} tone="positive">
              <Stack gap={3}>
                <Heading size={2}>Une question ?</Heading>
                <Text muted size={1} style={{ lineHeight: 1.6 }}>
                  Un champ qui manque, un comportement inattendu, une évolution
                  à prévoir : écrire à Isaure Lohest, qui a conçu et développé
                  le site.
                </Text>
                <Text size={2} weight="semibold">
                  <a href={`mailto:${CONTACT}`} style={{ color: "inherit" }}>
                    {CONTACT}
                  </a>
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>

      <style>{`
        .documentation__scroller {
          height: 100%;
          overflow: auto;
          scroll-behavior: smooth;
        }

        .documentation__layout {
          display: grid;
          grid-template-areas: "content toc";
          grid-template-columns: minmax(0, 1fr) minmax(13rem, 18rem);
          align-items: start;
          gap: 2rem;
        }

        .documentation__content {
          grid-area: content;
          min-width: 0;
        }

        .documentation__toc {
          grid-area: toc;
          position: sticky;
          top: 1rem;
          max-height: calc(100vh - 2rem);
          overflow: auto;
          padding-inline-start: 1.25rem;
          border-inline-start: 1px solid var(--card-border-color);
        }

        .documentation__toc-list {
          display: grid;
          gap: 0.15rem;
          margin: 0.75rem 0 0;
          padding: 0;
          list-style: none;
        }

        .documentation__toc-list li {
          border-inline-start: 2px solid transparent;
        }

        .documentation__toc-list li.is-active {
          border-inline-start-color: var(--card-focus-ring-color);
        }

        .documentation__toc-list a {
          display: grid;
          grid-template-columns: 2rem minmax(0, 1fr);
          gap: 0.35rem;
          padding: 0.3rem 0.45rem;
          color: var(--card-muted-fg-color);
          font-size: 0.875rem;
          line-height: 1.35;
          text-decoration: none;
        }

        .documentation__toc-list a:hover,
        .documentation__toc-list a:focus-visible,
        .documentation__toc-list a[aria-current="location"] {
          color: var(--card-fg-color);
        }

        .documentation__toc-list a[aria-current="location"] {
          font-weight: 600;
        }

        .documentation__toc-list a:focus-visible {
          outline: 2px solid var(--card-focus-ring-color);
          outline-offset: 2px;
        }

        @media (max-width: 899px) {
          .documentation__layout {
            grid-template-areas:
              "toc"
              "content";
            grid-template-columns: minmax(0, 1fr);
          }

          .documentation__toc {
            position: static;
            max-height: none;
            padding-block-start: 1rem;
            padding-inline-start: 0;
            border-block-start: 1px solid var(--card-border-color);
            border-inline-start: 0;
          }

          .documentation__toc-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 599px) {
          .documentation__toc-list {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .documentation__scroller {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </div>
  );
}
