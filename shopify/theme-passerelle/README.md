# Thème passerelle

La boutique en ligne Shopify de Studio Abîme ne montre rien. Elle renvoie.

## Pourquoi il existe

Le site est *headless* : `studioabime.com` est servi par Astro sur Cloudflare,
Shopify ne tient que le catalogue et le tunnel de paiement. Mais Shopify
continue d'écrire ses propres liens de retour, et ceux-là ne passent pas par
nous :

- le bouton « Continuer les achats » de la page de remerciement ;
- les liens des e-mails de confirmation de commande ;
- la page de suivi de commande et son lien vers la boutique ;
- les politiques affichées en pied de tunnel (`/policies/…`).

Tous pointent vers **la boutique en ligne**, c'est-à-dire vers le domaine
principal de la boutique Shopify. Cette destination n'est réglable nulle part :
elle est déduite du domaine, et le tunnel de paiement n'est plus un gabarit
qu'on peut éditer depuis la fin de `checkout.liquid` (2024). Le seul moyen d'y
toucher par du code serait une extension d'interface livrée par une app Shopify
— disproportionné pour un lien, et perdu le jour où la boutique change de mains.

D'où ce thème : puisqu'on ne peut pas empêcher Shopify d'envoyer les visiteurs
sur sa boutique en ligne, on fait de cette boutique un simple seuil. Chaque page
qu'elle sert renvoie immédiatement vers son équivalent sur le vrai site.

## Ce qu'il fait

Une seule vraie route, dans `layout/theme.liquid` — tous les gabarits sont
vides. La correspondance est établie à partir du chemin demandé :

| Boutique en ligne | Site |
| --- | --- |
| `/products/{handle}` | `/shop/{handle}` |
| `/collections/{handle}` | `/shop/collections/{handle}` |
| `/collections/all` | `/shop` |
| `/policies/refund-policy` | `/retours` |
| `/policies/shipping-policy` | `/livraison` |
| `/policies/terms-of-service` | `/cgv` |
| `/policies/privacy-policy` | `/confidentialite` |
| tout le reste | `/shop` |

Les handles de produits et de collections viennent de Shopify des deux côtés :
la correspondance est exacte, pas approchée. Renommer un handle dans l'admin la
déplace des deux côtés en même temps.

Le renvoi est tenté trois fois, du plus rapide au plus tolérant :
`location.replace` (immédiat, et sans laisser d'entrée dans l'historique — le
bouton « Précédent » ne doit pas ramener ici), une balise `refresh` (si le
JavaScript est coupé), un lien visible (si les deux échouent).

Toutes les pages sont en `noindex` : cette boutique ne doit exister pour aucun
moteur, elle ferait doublon avec le site et lui prendrait ses propres pages.

## Installation

```
cd shopify/theme-passerelle && zip -r ../theme-passerelle.zip . -x '.*' '__MACOSX/*'
```

Puis dans l'admin : **Online Store → Themes → Add theme → Upload zip**, et
**Publish**.

Le canal **Online Store** doit rester installé. Il ne sert qu'à ça.

## La protection par mot de passe

Tant que la boutique est en développement, Shopify impose la protection par mot
de passe et ne laisse pas la lever. Les liens de retour n'atterrissent alors pas
sur `layout/theme.liquid` mais sur `layout/password.liquid` — qui renvoie donc
lui aussi, pour que la passerelle fonctionne avant la mise en ligne comme après.

Ajouter `?passerelle=off` à l'URL désactive ce renvoi et redonne le formulaire,
quand on a besoin d'entrer réellement dans la boutique :

    https://…myshopify.com/password?passerelle=off

Le jour du passage sur un forfait payant, la protection tombe et c'est
`theme.liquid` qui prend le relais — avec, lui, la correspondance fine des
chemins. Rien à changer à ce moment-là.

## Le domaine

Le domaine principal de la boutique est **`shop.studioabime.com`** :
`studio-abime-qm0ief9y.myshopify.com` y renvoie en 301. C'est donc lui que
Shopify écrit dans ses liens de retour — et c'est aussi **le domaine du tunnel
de paiement** : le client saisit sa carte sur une adresse à la marque, pas sur
un `.myshopify.com` à suffixe aléatoire. C'est la vraie raison d'être de ce
sous-domaine ; le confort visuel du rebond n'en est qu'un effet secondaire.

`studioabime.com` lui-même ne pouvait pas être branché sur Shopify : l'apex est
déjà le domaine personnalisé du Worker Cloudflare (README principal, § Domaines
et redirections). Un nom ne résout que vers un seul hébergeur — le donner à
Shopify ferait disparaître le site.

Côté Cloudflare, dans la zone `studioabime.com` : un CNAME `shop` vers
`shops.myshopify.com`, **en DNS only (nuage gris)**. Proxifié, Shopify ne peut
pas émettre son certificat et le domaine reste bloqué en « pending ». En DNS
only, aucune Redirect Rule de la zone ne s'applique à ce nom : le trafic ne
passe pas par le réseau Cloudflare.

Noter la proximité voulue des deux adresses : `shop.studioabime.com` (Shopify,
qui ne fait que renvoyer) et `studioabime.com/shop` (la vraie boutique). Qui
tape la première atterrit sur la seconde.
