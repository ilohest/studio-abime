import { Badge, Box, Card, Container, Heading, Stack, Text } from '@sanity/ui';

/**
 * Mode d'emploi du back-office, affiché dans une entrée de la structure.
 *
 * Écrit en code et non saisi dans le CMS : c'est une notice, pas du contenu.
 * Elle ne doit ni pouvoir être modifiée par erreur, ni disparaître si le
 * dataset est réinitialisé — et elle suit les évolutions du site dans le même
 * commit que le changement qu'elle décrit.
 */

interface Point {
  titre: string;
  texte: string;
}

interface Chapitre {
  titre: string;
  chapeau?: string;
  ton: 'primary' | 'caution' | 'default';
  points: Point[];
}

/** Adresse de contact affichée en bas de la notice. */
const CONTACT = 'hello@isaure-lohest.com';

const CHAPITRES: Chapitre[] = [
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
    ],
  },
  {
    titre: 'Ce que vous gérez ici',
    ton: 'default',
    points: [
      {
        titre: 'Pages',
        texte:
          'Une entrée par page du site. Leur place et leur adresse sont fixées : vous en modifiez les textes et les images, pas l’emplacement. La page d’accueil est la seule à se composer en blocs — vous pouvez en ajouter, en retirer, les réordonner.',
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
      'La boutique a son propre back-office. Rien de ce qui suit ne se trouve dans Sanity — le site va le chercher directement chez Shopify, et affiche toujours l’état le plus récent.',
    ton: 'caution',
    points: [
      {
        titre: 'Les produits',
        texte:
          'Nom, description, photos, prix, déclinaisons et stock. Un produit épuisé ou dépublié dans Shopify disparaît du site de lui-même.',
      },
      {
        titre: 'Les collections',
        texte:
          'Ce sont elles qui forment le menu de la boutique sur le site. Créer une collection dans Shopify, c’est ajouter une entrée à ce menu ; la supprimer, c’est la retirer.',
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
    ],
  },
];

export default function Documentation() {
  return (
    <Box padding={4} overflow="auto" height="fill">
      <Container width={1}>
        <Stack gap={5}>
          <Stack gap={3}>
            <Heading size={4}>Mode d’emploi</Heading>
            <Text muted size={2}>
              Le site se pilote depuis deux endroits : ce back-office pour le contenu éditorial, et
              Shopify pour tout ce qui concerne la boutique. Cette page dit lequel fait quoi.
            </Text>
          </Stack>

          {CHAPITRES.map((chapitre) => (
            <Card key={chapitre.titre} padding={4} radius={2} shadow={1} tone={chapitre.ton}>
              <Stack gap={4}>
                <Stack gap={3}>
                  <Heading size={2}>{chapitre.titre}</Heading>
                  {chapitre.chapeau && (
                    <Text muted size={1}>
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
                  </Stack>
                ))}
              </Stack>
            </Card>
          ))}

          <Card padding={4} radius={2} tone="transparent">
            <Stack gap={3}>
              <Badge tone="primary">En cas de doute</Badge>
              <Text muted size={1} style={{ lineHeight: 1.6 }}>
                Une modification enregistrée n’est jamais perdue : tant qu’elle n’est pas publiée,
                le site continue d’afficher la version précédente. Vous pouvez donc essayer,
                regarder le résultat dans l’onglet Presentation, et ne publier qu’une fois
                satisfaite.
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
