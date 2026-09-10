/**
 * Articles de démonstration de la Bibliothèque.
 *
 *   npm run posts:demo              crée (ou remplace) les dix articles
 *   npm run posts:demo -- --delete  les supprime tous
 *
 * ── À quoi ils servent ──────────────────────────────────────────────────────
 * À voir les grilles avec du volume : chaque rubrique en reçoit trois ou
 * quatre, plusieurs articles appartiennent à plusieurs rubriques, les dates
 * s'étalent sur un an. Les textes sont plausibles pour que la mise en page soit
 * jugée sur de vraies longueurs — mais ce sont des TEXTES DE DÉMONSTRATION.
 *
 * ── Comment on les reconnaît ────────────────────────────────────────────────
 * Identifiant `post-demo-…`, slug `demo-…`, et une ligne « Statut : démo » dans
 * leur fiche. `--delete` ne touche QUE ces identifiants : aucun article saisi à
 * la main ne peut être emporté.
 *
 * Les visuels sont pris dans la médiathèque existante : rien n'est téléversé.
 */
import { createClient } from '@sanity/client';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('\nIl manque PUBLIC_SANITY_PROJECT_ID ou SANITY_API_WRITE_TOKEN dans .env.\n');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

/* ── Fabrique ─────────────────────────────────────────────────────────────── */

const image = (ref, alt) => ({ _type: 'image', alt, asset: { _type: 'reference', _ref: ref } });

let keySeed = 0;
const key = (prefix) => `${prefix}${++keySeed}`;

/** Un bloc de texte courant : un paragraphe par chaîne. */
const prose = (...paragraphs) => ({
  _key: key('prose'),
  _type: 'journalProse',
  body: paragraphs.map((text) => ({
    _key: key('p'),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key('s'), _type: 'span', marks: [], text }],
  })),
});

const note = (text) => ({ _key: key('note'), _type: 'journalNote', text });

const figure = (ref, alt, caption, placement = 'texte') => ({
  _key: key('fig'),
  _type: 'journalFigure',
  placement,
  scale: 'colonne',
  caption,
  images: [{ _key: key('img'), ...image(ref, alt) }],
});

const post = ({ id, title, slug, date, rubrics, template = 'revue', cover, excerpt, facts = [], blocks }) => ({
  _id: `post-demo-${id}`,
  _type: 'post',
  language: 'fr',
  title,
  slug: { _type: 'slug', current: `demo-${slug}` },
  rubrics,
  publishedAt: date,
  template,
  excerpt,
  coverImage: cover,
  listingFacts: [
    ...facts.map(([label, value]) => ({ _key: key('f'), _type: 'listingFact', label, value })),
    { _key: key('f'), _type: 'listingFact', label: 'Statut', value: 'démo' },
  ],
  blocks,
});

/* ── Les dix articles ─────────────────────────────────────────────────────── */

const posts = [
  post({
    id: '01',
    title: 'Ce que la marée laisse',
    slug: 'ce-que-la-maree-laisse',
    date: '2026-08-02',
    rubrics: ['carnet-de-voyages', 'references'],
    template: 'planche',
    cover: image('image-0e18fb15b54e27e585c69cf0028b8cf804935887-5247x7867-jpg', 'Estran à marée basse'),
    excerpt: 'Trois matins sur la même plage, à la même heure. Ce qui change n’est jamais ce qu’on attendait.',
    facts: [['Lieu', 'Côte d’Opale'], ['Durée', 'Trois matins']],
    blocks: [
      prose(
        'On revient sur une plage pour la même raison qu’on relit un livre : pour vérifier qu’on l’avait mal lu la première fois.',
        'Le premier matin, la mer avait laissé des lignes de coquilles, très régulières, comme tracées au cordeau. Le deuxième, plus rien — le sable lissé, sans mémoire.',
      ),
      note('La régularité ne vient pas de la mer mais du vent, qui trie les coquilles par poids.'),
      prose('Le troisième matin, il y avait une chaussure. Une seule. On ne photographie pas ce genre de chose sans se demander ce qu’on fait là.'),
    ],
  }),
  post({
    id: '02',
    title: 'Lettre à un imprimeur',
    slug: 'lettre-a-un-imprimeur',
    date: '2026-07-14',
    rubrics: ['correspondances'],
    cover: image('image-62e534120e854ceede3e4f45bfb465f50d2fbe9a-1728x1182-webp', 'Lettre manuscrite pliée'),
    excerpt: 'Une réponse arrivée trois semaines après la question, et qui en posait une meilleure.',
    facts: [['De', 'Un atelier de Gand'], ['Format', 'Deux feuillets']],
    blocks: [
      prose(
        'Nous avions demandé combien de passages il fallait pour obtenir ce noir-là, profond sans être bouché.',
        'La réponse tenait en une phrase : « Aucun, si vous acceptez que le papier boive. » Le reste de la lettre expliquait pourquoi nous avions tort de vouloir le contraire.',
      ),
      prose('Nous l’avons épinglée au-dessus de la table de montage. Elle y est encore.'),
    ],
  }),
  post({
    id: '03',
    title: 'Atelier : bandes d’essai',
    slug: 'atelier-bandes-d-essai',
    date: '2026-06-28',
    rubrics: ['journal'],
    cover: image('image-21acbf39779c0755c3d12d722ef5f46e829b1d41-900x1349-webp', 'Bandes d’essai suspendues à l’atelier'),
    excerpt: 'Une semaine à tirer des bandes d’essai avant de tirer quoi que ce soit d’autre.',
    facts: [['Semaine', '26'], ['Tirages', '48 bandes']],
    blocks: [
      prose(
        'Avant chaque série, une semaine de bandes : la même image, exposée par paliers, du trop clair au trop sombre.',
        'On les suspend dans l’ordre et on ne les regarde qu’après les avoir toutes tirées. Juger au fur et à mesure, c’est se laisser convaincre par la première qui ressemble à ce qu’on voulait.',
      ),
    ],
  }),
  post({
    id: '04',
    title: 'Pourquoi garder ce qui ne sert plus ?',
    slug: 'pourquoi-garder-ce-qui-ne-sert-plus',
    date: '2026-05-19',
    rubrics: ['essais'],
    cover: image('image-929458f4e26ed5228f05483ae56549e41d6b4531-692x1158-webp', 'Étude photographique de la lune'),
    excerpt: 'Une question posée à chaque déménagement d’archives, et jamais tranchée.',
    blocks: [
      prose(
        'Chaque fois qu’on déplace les réserves, la même discussion revient : ces boîtes de chutes, ces planches ratées, faut-il les garder ?',
        'L’argument pour les jeter est toujours le même, et toujours juste : personne ne les ouvrira. L’argument pour les garder ne se formule pas bien. Il tient à peu près en ceci : on ne sait pas encore ce qu’elles savent.',
      ),
      note('Nous n’avons, à ce jour, jamais rien jeté.'),
      prose('Cet essai ne conclut pas. Il n’y a pas de conclusion à une question qu’on repose tous les deux ans.'),
    ],
  }),
  post({
    id: '05',
    title: 'Strates',
    slug: 'strates',
    date: '2026-04-03',
    rubrics: ['carnet-de-voyages', 'essais'],
    template: 'planche',
    cover: image('image-f74d10efc9baff97135e1c22a74abfb87d7f05ac-5464x8192-jpg', 'Paroi rocheuse en strates'),
    excerpt: 'Une paroi, et la tentation de lire le temps comme on lit une page.',
    facts: [['Lieu', 'Vallée de la Meuse'], ['Altitude', '212 m']],
    blocks: [
      prose(
        'Une falaise se lit de bas en haut, comme une pile de journaux : le plus ancien dessous.',
        'Mais la comparaison s’arrête vite. Une strate ne dit pas ce qui s’est passé, seulement que quelque chose s’est déposé. Le reste, c’est nous qui l’écrivons.',
      ),
      figure('image-6235b7e6f1b1316b6eb2fff4fb136f363efd9054-2480x3508-jpg', 'Bloc de roche au sol', 'fig. 01 Bloc tombé de la paroi', 'marge'),
      prose('On est reparti avec une pierre dans la poche. Elle sert de presse-papier. Elle ne nous a rien appris de plus.'),
    ],
  }),
  post({
    id: '06',
    title: 'Revue de presse, été',
    slug: 'revue-de-presse-ete',
    date: '2026-03-21',
    rubrics: ['journal', 'correspondances'],
    cover: image('image-39344ebf16d6cb8b2113a938cbd44ae9b12bb136-422x600-webp', 'Papier exposé à la lumière'),
    excerpt: 'Ce qu’on a lu, entendu, découpé pendant les semaines chaudes.',
    blocks: [
      prose(
        'Un entretien radiophonique avec une typographe, réécouté trois fois. Un article sur les herbiers d’une école fermée. Une exposition vue deux fois, la seconde pour vérifier une légende.',
        'Rien de tout cela ne relève d’un sujet. C’est ce qui passe par l’atelier quand il fait trop chaud pour y travailler.',
      ),
    ],
  }),
  post({
    id: '07',
    title: 'Trois livres ouverts sur la table',
    slug: 'trois-livres-ouverts',
    date: '2026-02-11',
    rubrics: ['references'],
    cover: image('image-ecc8390d798aad2e655a74e7d2808521d3acb4c0-719x936-webp', 'Planche illustrée d’une main'),
    excerpt: 'Ils ne se répondent pas. C’est pour ça qu’ils sont ensemble.',
    facts: [['Livres', '3'], ['Ouverts depuis', 'Janvier']],
    blocks: [
      prose(
        'Un traité de botanique du XIXᵉ siècle, ouvert à la planche des fougères. Un catalogue de caractères en plomb. Un carnet de relevés de marées.',
        'On ne les a pas choisis pour ce qu’ils disent. On les a laissés ouverts parce qu’ils ont en commun une manière de ranger le monde en planches.',
      ),
    ],
  }),
  post({
    id: '08',
    title: 'La main qui classe',
    slug: 'la-main-qui-classe',
    date: '2025-12-04',
    rubrics: ['essais', 'references'],
    cover: image('image-d31aabaf8551b585206b7a113144491250e3e0bd-729x939-webp', 'Planche au cercle inscrit'),
    excerpt: 'Classer, c’est déjà interpréter. La question est de savoir qui s’en souvient.',
    blocks: [
      prose(
        'Tout classement dit quelque chose de celui qui classe. Mettre deux images côte à côte, c’est affirmer qu’elles se parlent.',
        'Les archivistes le savent et s’en défendent par des règles. Nous n’en avons pas. Nous avons des habitudes, ce qui est plus dangereux.',
      ),
      figure('image-9761df1d62e21a7636bac1bd4fcf49ca3825f99f-720x720-webp', 'Échantillons classés par strates', 'fig. 01 Un tiroir, avant et après'),
    ],
  }),
  post({
    id: '09',
    title: 'Retour de Goyet',
    slug: 'retour-de-goyet',
    date: '2025-10-17',
    rubrics: ['carnet-de-voyages', 'journal'],
    template: 'planche',
    cover: image('image-af2a953559922e73cbaf74a72c2bd1b466a4af89-5464x8192-jpg', 'Grotte de Goyet'),
    excerpt: 'Deux jours sous terre, et la lumière à réapprendre en sortant.',
    facts: [['Lieu', 'Goyet, Namur'], ['Durée', 'Deux jours']],
    blocks: [
      prose(
        'Sous terre, on règle l’appareil à tâtons. Il n’y a pas de bonne lumière, seulement celle qu’on apporte.',
        'Le plus troublant a été la sortie : dix minutes à ne rien pouvoir photographier, le jour étant devenu une matière trop dense.',
      ),
      note('Toutes les images de la grotte ont été prises à la lampe frontale.'),
    ],
  }),
  post({
    id: '10',
    title: 'Conversation avec une restauratrice',
    slug: 'conversation-avec-une-restauratrice',
    date: '2025-09-02',
    rubrics: ['correspondances', 'essais'],
    cover: image('image-96da402ed3c3f48264c60c49d197069e43ad4dbb-3761x5642-jpg', 'Détail d’un atelier de restauration'),
    excerpt: 'Réparer sans effacer : un métier fait de décisions que personne ne voit.',
    blocks: [
      prose(
        'Elle dit que le plus difficile n’est pas de réparer, mais de décider où s’arrêter. Une restauration réussie ne se voit pas ; une restauration excessive non plus, et c’est bien le problème.',
        'Nous lui avons demandé si elle pensait parfois aux gens qui regarderont ses réparations dans cent ans. Elle a répondu qu’elle pensait surtout à ceux qui les défairont.',
      ),
    ],
  }),
];

/* ── Écriture ─────────────────────────────────────────────────────────────── */

if (process.argv.includes('--delete')) {
  const ids = await client.fetch('*[_type == "post" && _id match "post-demo-*"]._id');
  if (ids.length === 0) {
    console.info('Aucun article de démonstration à supprimer.');
    process.exit(0);
  }
  const tx = ids.reduce((t, id) => t.delete(id), client.transaction());
  await tx.commit();
  console.info(`${ids.length} article(s) de démonstration supprimé(s).`);
  process.exit(0);
}

// Une seule transaction : la démo entre en entier, ou pas du tout.
const tx = posts.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
await tx.commit();

for (const doc of posts) {
  console.info(`✓ ${doc.publishedAt}  ${doc.title}  [${doc.rubrics.join(', ')}]`);
}
console.info(`\n${posts.length} articles de démonstration publiés.`);
