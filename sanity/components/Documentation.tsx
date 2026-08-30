import { useState } from 'react';
import { Badge, Box, Card, Container, Heading, Stack, Tab, TabList, TabPanel, Text } from '@sanity/ui';

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
const CONTACT = 'hello@isaure-lohest.com';

/** Admin de la boutique. À reprendre le jour où la boutique change de domaine. */
const ADMIN_SHOPIFY = 'https://studio-abime-qm0ief9y.myshopify.com/admin';

interface Point {
  titre: string;
  texte: string;
  /** Énumération, quand le point décrit une liste de champs plutôt qu'une règle. */
  liste?: Array<{ terme: string; texte: string }>;
}

interface Chapitre {
  titre: string;
  chapeau?: string;
  ton: 'primary' | 'caution' | 'critical' | 'default';
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
    titre: 'Les bases',
    ton: 'primary',
    points: [
      {
        titre: 'Brouillon et publication',
        texte:
          'Rien de ce que vous écrivez n’apparaît sur le site avant d’avoir été publié. Tant que la pastille « Draft » est allumée, vos modifications sont enregistrées mais restent privées. Le bouton Publish, en bas de l’écran, les met en ligne.',
      },
      {
        titre: 'Le sélecteur « Drafts / Published », tout en haut',
        texte:
          'Il choisit la version que le Studio vous montre. Sur « Drafts », vous voyez vos brouillons et vous pouvez écrire : c’est la position de travail, celle qu’il faut garder. Sur « Published », vous voyez le site tel qu’il est en ligne en ce moment, et les champs deviennent non modifiables — c’est une vitrine, pas une erreur. Si plus rien ne réagit sous vos doigts, regardez ce sélecteur en premier : il est probablement resté sur « Published ».',
      },
      {
        titre: 'Voir avant de publier',
        texte:
          'L’onglet Presentation, en haut de l’écran, affiche le site à côté du formulaire. Vous cliquez un texte dans la page, il s’ouvre à gauche ; vous le modifiez, la page se met à jour en direct.',
      },
      {
        titre: 'Les images',
        texte:
          'Chaque image se recadre à l’écran : le point que vous choisissez reste visible quelle que soit la forme de son cadre sur le site. Le « texte alternatif » décrit l’image pour les personnes qui ne la voient pas et pour les moteurs de recherche — une phrase suffit.',
      },
      {
        titre: 'L’onglet SEO',
        texte:
          'Chaque page en a un : titre et description affichés dans Google et sur les réseaux. Laissé vide, le site reprend le titre de la page et la description générale définie dans Réglages du site → Textes et SEO.',
      },
      {
        titre: 'L’adresse d’une page, dans l’onglet SEO',
        texte:
          'Elle est composée à partir du titre la première fois que vous publiez, puis elle ne bouge plus. C’est voulu : renommer un projet pour une coquille ne doit pas déplacer sa page, sinon les liens déjà partagés cesseraient de fonctionner à chaque correction.',
      },
      {
        titre: 'Corriger une adresse sans rien casser',
        texte:
          'Si l’adresse ne convient pas — une page publiée sous un titre provisoire garde ce titre dans son adresse — modifiez-la dans l’onglet SEO. Au moment de publier, le Studio vous montre l’ancienne et la nouvelle, et vous propose de rediriger. Acceptez : l’ancienne adresse continuera de mener à la page, et rien de ce qui a été partagé ne se perdra. Ne refusez que si vous êtes certaine que personne n’a jamais eu cette adresse.',
      },
    ],
  },
  {
    titre: 'Ce que vous gérez ici',
    ton: 'default',
    points: [
      {
        titre: 'Pages',
        texte:
          'Une entrée par page du site. Leur place et leur adresse sont fixées : vous en modifiez les textes et les images, pas l’emplacement. La succession des blocs est fixée elle aussi — c’est la mise en page, pas de l’édition. Vous changez ce que chaque bloc dit ; vous n’en ajoutez pas, n’en retirez pas et ne les réordonnez pas.',
      },
      {
        titre: 'Projets',
        texte:
          'Le portfolio. Chaque fiche porte son visuel, ses informations et son texte. La case « Projet favori » a un effet visible ailleurs : les favoris alimentent la table des éléments de la page Expériences, la sélection de l’accueil et l’archive du Labo.',
      },
      {
        titre: 'Clients',
        texte:
          'La liste des références. Son ordre compte : c’est lui qui remplit les cases de la table des éléments, sur la page Expériences.',
      },
      { titre: 'Journal', texte: 'Les articles, classés en deux rubriques : Cahier de recherche et Actualités.' },
      {
        titre: 'Réglages du site',
        texte:
          'Le nom du site, sa description par défaut, son image sociale, la page servie à la racine, et les liens vers les réseaux sociaux.',
      },
      {
        titre: 'Mentions légales, confidentialité, cookies',
        texte:
          'Ces trois pages décrivent l’entreprise, pas la boutique : elles s’écrivent ici, dans Pages, sous le trait de séparation.',
      },
    ],
  },
  {
    titre: 'Ce qui se gère dans Shopify',
    chapeau:
      'La boutique a son propre back-office. Rien de ce qui suit ne se trouve dans Sanity — le site va le chercher directement chez Shopify, et affiche toujours l’état le plus récent. Le détail est dans l’onglet « La boutique » ci-dessus.',
    ton: 'caution',
    points: [
      {
        titre: 'Les produits et les collections',
        texte:
          'Nom, description, photos, prix, déclinaisons, stock, et le rangement dans les trois collections. Un produit épuisé ou dépublié dans Shopify disparaît du site de lui-même.',
      },
      {
        titre: 'CGV, Livraison, Retours et remboursements',
        texte:
          'Ces trois pages s’écrivent dans l’admin Shopify, sous Paramètres → Politiques. Elles servent à la fois au tunnel de paiement et au site : une seule saisie, deux affichages. Une politique laissée vide n’a pas de page sur le site.',
      },
      {
        titre: 'Commandes et paiements',
        texte:
          'Commandes, clients de la boutique, expéditions, moyens de paiement, taxes et frais de port : tout se passe dans Shopify.',
      },
    ],
  },
  {
    titre: 'Ce qui n’est ni dans l’un ni dans l’autre',
    chapeau:
      'Certaines choses sont fixées dans le code du site. C’est voulu : ce sont des décisions de conception, pas du contenu — elles ne bougent pas d’une page à l’autre et ne doivent pas pouvoir se défaire par inadvertance.',
    ton: 'default',
    points: [
      {
        titre: 'La navigation et les intitulés de section',
        texte:
          'Le menu principal, les numéros de section (01. Le Labo, 02. Expériences…) et les titres des pages d’index sont portés par le site.',
      },
      {
        titre: 'La mise en page',
        texte:
          'Typographie, couleurs, tailles, marges, animations : la charte est appliquée en code. Le back-office porte le contenu, jamais la forme.',
      },
      {
        titre: 'Les rubriques du Journal',
        texte:
          'Cahier de recherche et Actualités structurent la page autant qu’elles classent les articles : elles sont fixées, mais vous choisissez librement la rubrique de chaque article.',
      },
      {
        titre: 'Les libellés des boutons de la boutique',
        texte:
          '« J’investis dans une vision », « dans un outil », « dans mes connaissances » : chaque famille de produits a le sien, écrit dans le code du site. Rien à saisir dans Shopify.',
      },
    ],
  },
];

/* ── Onglet 2 : la boutique ──────────────────────────────────────────────── */

const SHOPIFY: Chapitre[] = [
  {
    titre: '00. Accès',
    ton: 'primary',
    points: [
      {
        titre: 'Où se connecter',
        texte: `Tout se pilote depuis l’admin Shopify : ${ADMIN_SHOPIFY}. C’est un back-office séparé de celui-ci, avec ses propres identifiants.`,
      },
      {
        titre: 'Le site n’est pas un thème Shopify',
        texte:
          'La boutique est « headless » : Shopify tient le catalogue, les paiements et les commandes, et le site va les chercher pour les afficher à sa manière. Conséquence pratique : la section « Boutique en ligne → Thèmes » de l’admin ne sert à rien ici, et ce qu’on y modifierait n’aurait aucun effet sur le site.',
      },
      {
        titre: 'Le délai d’affichage',
        texte:
          'Les prix, le stock et la disponibilité sont lus en direct. Le reste — un produit ajouté, un texte modifié, une photo changée — apparaît à la reconstruction suivante du site. Comptez quelques minutes, pas l’instantané.',
      },
    ],
  },
  {
    titre: '01. Les trois familles',
    chapeau:
      'C’est la saisie la plus importante de toute la boutique. Un seul champ, « Type de produit », décide de trois choses à la fois : la collection dans laquelle le produit se range, le libellé de son bouton d’achat, et les informations affichées sur sa fiche.',
    ton: 'caution',
    points: [
      {
        titre: 'Où le renseigner',
        texte:
          'Dans la fiche produit, colonne de droite, carte « Organisation du produit », champ « Type de produit ».',
      },
      {
        titre: 'Les trois valeurs, à écrire exactement ainsi',
        texte:
          'La comparaison est littérale : une minuscule à la place d’une majuscule, un espace en trop, et le produit ne rejoint pas sa collection.',
        liste: [
          { terme: 'Transmission', texte: 'Ce qui se transmet — formations, ateliers.' },
          { terme: 'Contemplation', texte: 'Ce qui se contemple — tirages, livres, cartes postales.' },
          { terme: 'Outil', texte: 'Ce qui s’utilise — carnets, jeux de cartes.' },
        ],
      },
      {
        titre: 'Si un produit n’apparaît nulle part',
        texte:
          'Neuf fois sur dix, c’est ce champ. Relisez-le caractère par caractère avant de chercher ailleurs. Un produit sans famille reste vendable, mais il n’entre dans aucune collection, garde le bouton générique « Ajouter au panier » et n’affiche aucune de ses informations complémentaires.',
      },
      {
        titre: 'À ne pas confondre avec « Catégorie »',
        texte:
          'Juste au-dessus se trouve un champ « Catégorie », qui propose une liste toute faite venue de Shopify. Il sert aux taxes et à Google, pas au site. Vous pouvez le renseigner, mais ce n’est pas lui qui range le produit.',
      },
    ],
  },
  {
    titre: '02. Les collections se remplissent toutes seules',
    chapeau:
      'Les trois collections du site — Ce qui se transmet, Ce qui se contemple, Ce qui s’utilise — sont automatisées. Chacune ramasse les produits dont le « Type de produit » correspond, sans intervention.',
    ton: 'default',
    points: [
      {
        titre: 'Ne jamais ajouter un produit à la main',
        texte:
          'Une collection automatisée n’accepte pas d’ajout manuel, et il n’y a rien à y faire : renseignez le type sur la fiche produit, la collection suit. Un nouveau produit s’y range de lui-même, aujourd’hui comme dans deux ans.',
      },
      {
        titre: 'Le temps de recalcul',
        texte:
          'Après avoir renseigné ou corrigé un type, Shopify met une à deux minutes à recomposer la collection. Si le produit n’y est pas immédiatement, attendez avant de conclure à une erreur.',
      },
      {
        titre: 'Ce que vous pouvez modifier',
        texte:
          'Le titre affiché, le texte d’introduction et l’image de la collection. En revanche, ne touchez ni aux conditions, ni à l’adresse (le « handle ») : la première casse le rangement, la seconde casse tous les liens existants vers la collection.',
      },
    ],
  },
  {
    titre: '03. Les informations complémentaires',
    chapeau:
      'Shopify les appelle « metafields ». Ce sont les champs sur mesure, tout en bas de la fiche produit, sous la description et les variantes. Ils alimentent la petite fiche technique affichée sur le site.',
    ton: 'default',
    points: [
      {
        titre: 'Tous les champs apparaissent sur toutes les fiches',
        texte:
          'C’est une limite de Shopify, pas un oubli : l’admin ne sait pas masquer un champ selon la famille du produit. Vous verrez donc « Prérequis » sur un tirage. Ne le remplissez pas — le site n’affiche que les champs de la famille du produit, et ce qui est saisi ailleurs reste invisible. Cela ne casse rien, c’est juste du travail perdu.',
      },
      {
        titre: 'Sur tous les produits',
        texte: 'Ces trois-là valent pour les trois familles.',
        liste: [
          {
            terme: 'Origine de production',
            texte:
              'Qui l’a fabriqué, quand l’objet vient d’ailleurs. C’est ce champ qui porte le « ce qu’on relaie » : il n’a pas sa collection, il s’affiche sur la fiche.',
          },
          {
            terme: 'Nombre max',
            texte: 'Le total annoncé : le tirage d’une édition, le nombre de places d’une session.',
          },
          {
            terme: 'Afficher la jauge',
            texte:
              'Coché, la fiche annonce ce total et, à côté du prix, le nombre restant. Décoché, elle ne dit rien de la quantité.',
          },
        ],
      },
      {
        titre: 'Sur les formations seulement',
        texte: 'Ceux-ci ne s’affichent que sur un produit de type Transmission.',
        liste: [
          { terme: 'Date & heure', texte: 'Affichée en toutes lettres sur la fiche.' },
          { terme: 'Lieu', texte: 'En ligne, une adresse, une ville.' },
          { terme: 'Prérequis', texte: 'Ce qu’il faut savoir ou avoir avant de venir.' },
          { terme: 'Compétences que ça apporte', texte: 'Ce qu’on emporte en partant.' },
          { terme: 'Ce que tu en fais après', texte: 'L’usage concret, une fois la formation finie.' },
          { terme: 'Collaborateurs', texte: 'Les personnes qui interviennent avec vous.' },
        ],
      },
      {
        titre: 'Sur les outils seulement',
        texte: 'Un seul champ, mais il compte.',
        liste: [
          {
            terme: 'Catégorie (rayon)',
            texte:
              'Le rayon de l’outil : Solidité de com, Esthétique, Réflexion, Structure. Écrivez-le toujours de la même façon — c’est lui qui permettra de filtrer la collection.',
          },
        ],
      },
      {
        titre: 'Ne pas créer de nouveau champ sans prévenir',
        texte:
          'Un champ créé dans l’admin n’apparaît pas sur le site pour autant : il faut que le site sache aller le chercher, et que la définition ait l’autorisation d’être lue par la vitrine. Les deux se règlent en code. Dites-le, c’est l’affaire de quelques minutes.',
      },
    ],
  },
  {
    titre: '04. Les déclinaisons',
    chapeau:
      'Shopify les appelle « variantes ». Ce sont les versions achetables d’un même produit : un tirage en quatre formats, une formation en trois sessions.',
    ton: 'default',
    points: [
      {
        titre: 'Comment les créer',
        texte:
          'Dans la fiche produit, section Variantes : donnez un nom à l’axe (« Format », « Session »), puis ses valeurs. Chaque combinaison devient une ligne, avec son prix et son stock propres.',
      },
      {
        titre: 'Un tirage',
        texte:
          'L’axe s’appelle Format, ses valeurs sont les formats de papier. Chaque format a son prix : le site affiche « à partir de » dans la grille, et le prix exact dès qu’on choisit.',
      },
      {
        titre: 'Une formation',
        texte:
          'L’axe s’appelle Session, ses valeurs sont les dates ou les lieux. Chaque session a son propre nombre de places, et se ferme toute seule quand elle est complète, sans toucher aux autres.',
      },
      {
        titre: 'Un produit sans déclinaison',
        texte:
          'Ne créez pas d’axe pour un produit unique. Shopify fabrique alors une variante invisible, que le site ignore : la fiche affiche simplement son prix.',
      },
    ],
  },
  {
    titre: '05. Le stock et les places restantes',
    chapeau:
      'Deux chiffres différents, saisis à deux endroits. Le total est une information éditoriale, le restant est du stock réel.',
    ton: 'default',
    points: [
      {
        titre: 'Le total',
        texte:
          'C’est le champ « Nombre max », en bas de la fiche. Il ne bouge pas : c’est ce que vous annoncez — une édition de 30, une session de 12 places.',
      },
      {
        titre: 'Le restant',
        texte:
          'C’est l’inventaire Shopify, dans la section Inventaire de chaque variante. Il descend tout seul à chaque vente. Pour qu’il s’affiche, il faut cocher « Suivre la quantité » et saisir la quantité de départ — la même que le total.',
      },
      {
        titre: 'Quand la quantité diffère selon la déclinaison',
        texte:
          'Un A2 n’est pas tiré au même nombre qu’un A4, une session de mars n’a pas le même nombre de places que celle de juin. Dans ce cas, le « Nombre max » se renseigne sur chaque variante et non sur le produit : ouvrez la variante, le champ est en bas de sa page.',
      },
      {
        titre: 'Une formation n’est pas un objet',
        texte:
          'Dans la fiche d’une formation, décochez « Ceci est un produit physique » — sinon Shopify réclame un poids et applique des frais de port à une inscription. Et activez le suivi du stock : c’est lui qui ferme les inscriptions quand la session est pleine.',
      },
    ],
  },
  {
    titre: '06. Publier, masquer, retirer',
    chapeau: 'Quatre gestes, du plus réversible au plus définitif. Prenez toujours le plus doux qui fasse l’affaire.',
    ton: 'default',
    points: [
      {
        titre: 'Actif',
        texte: 'Le produit est en ligne. C’est l’état normal.',
      },
      {
        titre: 'Brouillon',
        texte:
          'Le produit disparaît du site mais reste entier dans l’admin, avec ses photos, ses prix et ses réglages. C’est le bon geste pour retirer temporairement quelque chose, ou préparer un produit avant sa sortie.',
      },
      {
        titre: 'Épuisé, mais visible',
        texte:
          'Laissez le produit Actif et mettez son stock à zéro : il reste sur le site, son bouton devient « Épuisé ». Utile pour une édition terminée qu’on veut continuer de montrer.',
      },
      {
        titre: 'Archivé, et supprimé',
        texte:
          'Archiver sort le produit de la liste tout en le gardant en mémoire ; on peut le réactiver. Supprimer est définitif et sans retour. Ne supprimez jamais un produit qui a été vendu : son historique de commande en dépend.',
      },
      {
        titre: 'Le canal de vente',
        texte:
          'Dans la carte « Publication » de la fiche, la boutique en ligne doit rester cochée. Décochée, le produit devient invisible sur le site quel que soit son statut — c’est une cause de disparition facile à oublier.',
      },
    ],
  },
  {
    titre: '07. Les pages CGV, Livraison, Retours',
    ton: 'default',
    points: [
      {
        titre: 'Où les écrire',
        texte:
          'Admin Shopify → Paramètres → Politiques. Ces trois textes servent à la fois au tunnel de paiement et aux pages du site : une seule saisie, deux affichages, aucune divergence possible.',
      },
      {
        titre: 'Une politique vide n’a pas de page',
        texte:
          'Tant qu’un de ces textes n’est pas écrit, le site ne publie pas la page correspondante et n’y renvoie pas. Rien à désactiver.',
      },
      {
        titre: 'À ne pas confondre',
        texte:
          'Mentions légales, confidentialité et cookies décrivent l’entreprise et non la boutique : celles-là s’écrivent dans l’autre back-office, dans Pages.',
      },
    ],
  },
  {
    titre: '08. Commandes et clients',
    ton: 'default',
    points: [
      {
        titre: 'Tout se passe dans Shopify',
        texte:
          'Commandes, préparation, expédition, remboursements, clients, taxes et frais de port : le site ne fait que rediriger vers le paiement, il ne conserve rien.',
      },
      {
        titre: 'Une commande d’inscription',
        texte:
          'Une formation vendue arrive comme n’importe quelle commande. La session achetée est le nom de la variante — c’est là que vous lisez à quelle date la personne s’est inscrite.',
      },
    ],
  },
  {
    titre: '09. À éviter',
    chapeau: 'Dans le doute, ne changez rien et demandez. Ces cinq gestes-là cassent quelque chose de visible.',
    ton: 'critical',
    points: [
      {
        titre: 'Renommer l’adresse d’une collection ou d’un produit',
        texte:
          'Le « handle » est l’adresse de la page sur le site. Le modifier casse tous les liens existants — ceux que vous avez partagés, ceux qui sont dans une newsletter, ceux qu’a retenus Google.',
      },
      {
        titre: 'Modifier ou supprimer une définition de champ',
        texte:
          'Dans Paramètres → Données personnalisées, chaque champ a un nom technique que le site connaît par cœur. Le renommer ou le supprimer fait disparaître l’information de toutes les fiches d’un coup, sans avertissement.',
      },
      {
        titre: 'Changer les conditions d’une collection',
        texte:
          'Elles sont réglées sur les trois valeurs du « Type de produit ». Une condition modifiée, et une collection entière se vide.',
      },
      {
        titre: 'Toucher au canal Headless',
        texte:
          'Dans Paramètres → Applications, l’entrée Headless est la porte par laquelle le site lit la boutique. La désinstaller ou régénérer ses jetons coupe le catalogue et le panier, immédiatement.',
      },
      {
        titre: 'Supprimer un produit vendu',
        texte:
          'L’historique de commande y est attaché. Archivez-le : il disparaît de la liste, tout est conservé.',
      },
    ],
  },
];

const ONGLETS: Onglet[] = [
  {
    id: 'sanity',
    titre: 'Le back-office',
    chapeau:
      'Le site se pilote depuis deux endroits : ce back-office pour le contenu éditorial, et Shopify pour tout ce qui concerne la boutique. Cet onglet dit lequel fait quoi.',
    chapitres: SANITY,
  },
  {
    id: 'shopify',
    titre: 'La boutique',
    chapeau:
      'Tout ce qui concerne les produits, les collections, le stock et les commandes se fait dans l’admin Shopify. Cet onglet suit l’ordre dans lequel les questions se posent : d’abord ranger un produit, puis le décrire, puis le publier.',
    chapitres: SHOPIFY,
  },
];

function Chapitres({ chapitres }: { chapitres: Chapitre[] }) {
  return (
    <Stack gap={5}>
      {chapitres.map((chapitre) => (
        <Card key={chapitre.titre} padding={4} radius={2} shadow={1} tone={chapitre.ton}>
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
                  <Stack gap={3} marginTop={2} paddingLeft={3} style={{ borderLeft: '1px solid var(--card-border-color)' }}>
                    {point.liste.map((entree) => (
                      <Text key={entree.terme} muted size={1} style={{ lineHeight: 1.6 }}>
                        <strong>{entree.terme}</strong> — {entree.texte}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

export default function Documentation() {
  const [actif, setActif] = useState(ONGLETS[0].id);

  return (
    <Box padding={4} overflow="auto" height="fill">
      <Container width={1}>
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
                onClick={() => setActif(onglet.id)}
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
                <Chapitres chapitres={onglet.chapitres} />
              </Stack>
            </TabPanel>
          ))}

          <Card padding={4} radius={2} tone="transparent">
            <Stack gap={3}>
              <Badge tone="primary">En cas de doute</Badge>
              <Text muted size={1} style={{ lineHeight: 1.6 }}>
                Dans ce back-office, une modification enregistrée n’est jamais perdue : tant qu’elle
                n’est pas publiée, le site continue d’afficher la version précédente. Dans Shopify,
                il n’y a pas de brouillon pour les textes — mais rien n’oblige à publier un produit :
                laissez-le en « Brouillon » le temps de le préparer.
              </Text>
            </Stack>
          </Card>

          <Card padding={4} radius={2} shadow={1} tone="positive">
            <Stack gap={3}>
              <Heading size={2}>Une question ?</Heading>
              <Text muted size={1} style={{ lineHeight: 1.6 }}>
                Un champ qui manque, un comportement inattendu, une évolution à prévoir : le site a
                été conçu et développé par Isaure Lohest, écrivez-lui.
              </Text>
              <Text size={2} weight="semibold">
                <a href={`mailto:${CONTACT}`} style={{ color: 'inherit' }}>
                  {CONTACT}
                </a>
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
