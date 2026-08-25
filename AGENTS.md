# Charte de développement — objectif Awwwards Site of the Day

## Portée

Cette charte s'applique à toute intervention sur l'expérience publique du site Studio Abîme, en particulier à la création ou à la refonte d'une page, d'une section, d'un gabarit, d'une interaction ou d'un contenu Sanity.

L'objectif est de construire un candidat crédible au **Awwwards Site of the Day (SOTD)** sans sacrifier la clarté, l'accessibilité, la performance ou la voix du studio. Un effet spectaculaire ne justifie jamais une expérience moins utilisable.

Avant toute modification visuelle importante, relire cette charte et le design system décrit dans `README.md` et `src/styles/global.css`.

## Critères officiels Awwwards

Le système d'évaluation officiel pondère les candidatures ainsi :

- **Design — 40 %** : direction artistique, composition, hiérarchie, typographie, couleur, cohérence et qualité de finition ;
- **Usability — 30 %** : compréhension, navigation, lisibilité, responsive, accessibilité et fluidité des interactions ;
- **Creativity — 20 %** : idée originale, narration, interactions signifiantes et exécution singulière ;
- **Content — 10 %** : pertinence, clarté, qualité éditoriale et force des médias.

Source : [Awwwards — Evaluation System](https://www.awwwards.com/about-evaluation/). Ces quatre pondérations sont officielles ; les règles opérationnelles ci-dessous sont les standards internes du projet pour les servir.

## Principes de direction

### Une idée forte, pas une collection d'effets

- Chaque page doit pouvoir se résumer par une intention et un geste mémorable.
- Cette singularité doit prolonger le territoire Studio Abîme : matière imprimée, profondeur, archive, enquête et « plongée sous le visible ».
- Ne pas copier une tendance Awwwards ni ajouter de 3D, scroll-jacking, WebGL, curseur ou transition uniquement pour paraître spectaculaire.
- Préserver un fil rouge entre les pages tout en donnant à chaque projet un rythme et une mise en scène propres.

### Le contenu dirige la composition

- Définir avant le code : le propos, l'ordre narratif, l'action principale, les médias disponibles et le moment culminant de la page.
- Concevoir avec du contenu réel ou représentatif ; ne pas laisser le lorem ipsum déterminer une mise en page finale.
- Traiter les images, vidéos, légendes, crédits et textes comme des éléments éditoriaux, pas comme du remplissage.
- Toute page publique doit avoir un titre clair, une hiérarchie sémantique correcte et les métadonnées SEO/sociales pertinentes.

### La créativité reste utilisable

- L'utilisateur doit comprendre où il est, ce qui est interactif et comment revenir ou poursuivre.
- Aucun contenu ni action essentiel ne doit dépendre uniquement du survol, du curseur personnalisé, du son, d'une animation ou d'un geste complexe.
- Le scroll natif et les liens natifs sont la base. Toute sophistication doit améliorer la narration sans confisquer le contrôle.
- Les états focus, hover, active, loading, erreur et vide doivent être intentionnels et cohérents.
- Une page doit rester compréhensible si les animations ou JavaScript ne s'exécutent pas.

### Le mobile est une composition, pas une réduction

- Concevoir et vérifier au minimum les largeurs 390 px, 768 px et 1440 px, ainsi qu'un écran tactile.
- Réordonner, simplifier ou remplacer un geste lorsque la version desktop ne se transpose pas naturellement.
- Interdire le débordement horizontal involontaire, les zones tactiles trop petites, les textes tronqués et les médias sans dimensions réservées.

### Le mouvement est une chorégraphie

- Chaque animation doit avoir une fonction : guider l'attention, expliquer une relation, donner du rythme ou confirmer une action.
- Utiliser peu de durées et de courbes cohérentes plutôt qu'une animation différente par composant.
- Respecter `prefers-reduced-motion`; supprimer les mouvements non essentiels et garantir une alternative instantanée.
- Éviter les animations qui retardent l'accès au contenu, dégradent le scroll ou provoquent des décalages de mise en page.

## Exigences techniques non négociables

- Utiliser les tokens et rôles sémantiques existants dans `src/styles/global.css`; ne pas introduire de couleur, fonte ou rythme arbitraire dans un composant.
- Préférer Astro et le HTML/CSS natifs. Ajouter une hydratation client seulement si l'interaction l'exige réellement, et la charger aussi tard que l'usage le permet.
- Fournir des images responsive, correctement compressées, avec dimensions explicites, texte alternatif pertinent et chargement prioritaire uniquement pour le contenu au-dessus de la ligne de flottaison.
- Viser **WCAG 2.2 niveau AA** : HTML sémantique, navigation clavier complète, focus visible, contrastes suffisants, libellés explicites, alternatives aux médias et zoom/reflow utilisables.
- Viser, au 75e centile mobile et desktop, les seuils Core Web Vitals : **LCP ≤ 2,5 s**, **INP ≤ 200 ms**, **CLS ≤ 0,1**.
- Ne jamais compromettre les licences des fontes, images, vidéos ou sons. La fonte de démonstration signalée dans `README.md` doit être remplacée avant la mise en production.

Références qualité : [WCAG 2.2](https://www.w3.org/TR/WCAG22/) et [Web Vitals](https://web.dev/articles/vitals).

## Processus obligatoire pour une nouvelle page

### Avant de coder

1. Formuler l'objectif utilisateur et l'intention narrative en une phrase chacun.
2. Identifier le geste distinctif de la page et expliquer comment il sert le contenu.
3. Inventorier les contenus et médias réels, y compris leurs variantes mobiles et leurs crédits.
4. Définir le parcours clavier, la version sans mouvement et le comportement sans JavaScript.
5. Vérifier ce qui peut être composé avec les primitives, sections, gabarits et tokens existants avant d'en créer de nouveaux.

### Pendant l'implémentation

1. Maintenir une hiérarchie HTML sémantique et un ordre de lecture logique indépendant de la mise en page visuelle.
2. Construire d'abord l'expérience essentielle, puis ajouter les couches de mouvement et de surprise comme améliorations progressives.
3. Tester les contenus extrêmes : titres longs, absence d'image, portrait/paysage, listes courtes ou longues, traduction future.
4. Surveiller le poids JavaScript, les polices, les images et les vidéos ajoutées. Toute dépense de performance doit avoir un bénéfice perceptible.
5. Ne pas uniformiser une proposition singulière au point de perdre son caractère ; ne pas casser le système global pour une singularité locale.

### Avant de considérer la page terminée

- Exécuter `npm run build`.
- Vérifier visuellement la page à 390, 768 et 1440 px, avec contenu réel.
- Parcourir toute la page au clavier et confirmer que le focus reste visible et logique.
- Tester `prefers-reduced-motion`, le tactile et l'absence de survol.
- Contrôler l'absence de débordement, de saut de mise en page, de média déformé et de texte illisible.
- Contrôler les titres, descriptions, partage social, textes alternatifs, légendes et crédits.
- Mesurer la performance sur un build de production et signaler explicitement tout écart aux objectifs plutôt que de le masquer.
- Faire une dernière lecture selon les quatre critères Awwwards, dans leur ordre de poids : Design, Usability, Creativity, Content.

## Format de compte rendu attendu

Lorsqu'une page ou une expérience visuelle est livrée, le compte rendu doit préciser brièvement :

- l'intention créative et le geste distinctif ;
- les choix faits pour l'utilisabilité et l'accessibilité ;
- l'impact performance ou les compromis connus ;
- les validations réellement effectuées et celles qui restent à faire.

Ne jamais affirmer qu'une page est « Awwwards-ready » sur la seule base d'un build réussi : la qualité des contenus finaux, des médias, de la direction artistique, de l'exécution sur appareils réels et du site complet doit aussi être revue.
