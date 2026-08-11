# Import de la page d’accueil

## Inventaire source

- Source : `src/content/homeFallback.ts`
- Locale : français
- Documents : 1 page, 1 réglage localisé, 1 réglage global
- Sections : 7
- Images locales : 8
- Relations : le réglage français référence la page d’accueil

## Mapping

- `getHomeFallback('fr')` → document `page`
- `fallbackImage` / `fallbackBackground` → assets et champs `image` Sanity
- `fallbackItems` → `projectShowcase.placeholderItems`
- titre, description et image de partage → objet `seo`
- sélection de la page d’accueil → `localizedSettings.homePage`

Les quatre « Projet en cours » restent des visuels temporaires intégrés à la section. Ils ne créent pas de faux documents `project` et sont automatiquement remplacés à l’affichage dès que de vrais projets sont sélectionnés.

## Import et rejouabilité

Le script `migration/scripts/import-home-fallback.ts` réutilise les assets par `originalFilename` et retrouve la page par locale et slug. Il ne remplace aucun contenu : les documents sont créés uniquement s’ils n’existent pas, et tout conflit interrompt l’import. Les singletons utilisent les identifiants `siteSettings` et `localizedSettings-fr`.

## Validation et bascule

Le script vérifie le nombre de sections, la référence d’accueil et le nombre d’assets. La route `/` utilise automatiquement Sanity dès que `localizedSettings-fr.homePage` est défini ; aucun redirect ni gel éditorial n’est nécessaire pour cette migration initiale.
