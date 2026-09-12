/**
 * Destinataire d'une carte cadeau.
 *
 * ── Le mécanisme ────────────────────────────────────────────────────────────
 * Shopify sait envoyer lui-même une carte cadeau à quelqu'un d'autre que
 * l'acheteuse : le code, le message et la date d'envoi voyagent avec la ligne de
 * commande, sous des clés RÉSERVÉES que le paiement reconnaît. Dans un thème,
 * un formulaire tout fait les pose ; en headless, il n'existe pas — c'est à nous
 * de les écrire, et elles doivent l'être au caractère près.
 *
 * Les noms proviennent du thème officiel Dawn (`gift-card-recipient-form`), qui
 * fait autorité : ce sont ceux que le paiement lit.
 *
 * ⚠️ SANS `__shopify_send_gift_card_to_recipient`, rien ne se déclenche. Le code
 * part alors à l'acheteuse, sans erreur ni avertissement — la commande passe,
 * simplement le cadeau n'arrive pas. C'est le seul champ vraiment critique.
 *
 * ── Côté panier ─────────────────────────────────────────────────────────────
 * L'équivalent d'une propriété de ligne, dans l'API Cart, est un `attribute` de
 * ligne. On les pose à l'ajout ; Shopify les recopie sur la commande.
 */

/** Ce que la cliente saisit sur la fiche. */
export interface GiftRecipient {
  email: string;
  name: string;
  message: string;
  /** Date d'envoi au format `AAAA-MM-JJ`. Vide : la carte part dès l'achat. */
  sendOn: string;
}

/** Longueurs imposées par Shopify — au-delà, la commande est refusée. */
export const GIFT_LIMITS = { name: 255, message: 200 } as const;

export interface CartLineAttribute {
  key: string;
  value: string;
}

/**
 * Traduit la saisie en attributs de ligne.
 *
 * Les champs vides sont omis plutôt qu'envoyés vides : une propriété présente
 * mais sans valeur s'affiche quand même sur la commande, et ferait lire au
 * service une ligne « Message : » suivie de rien.
 */
export function giftAttributes(recipient: GiftRecipient): CartLineAttribute[] {
  const email = recipient.email.trim();
  if (!email) return [];

  const attributes: CartLineAttribute[] = [
    { key: '__shopify_send_gift_card_to_recipient', value: 'on' },
    { key: 'Recipient email', value: email },
  ];

  const name = recipient.name.trim();
  if (name) attributes.push({ key: 'Recipient name', value: name.slice(0, GIFT_LIMITS.name) });

  const message = recipient.message.trim();
  if (message) attributes.push({ key: 'Message', value: message.slice(0, GIFT_LIMITS.message) });

  const sendOn = recipient.sendOn.trim();
  if (sendOn) {
    attributes.push({ key: 'Send on', value: sendOn });
    /*
      Le décalage horaire accompagne la date : sans lui, Shopify l'interprète
      dans le fuseau de la boutique, et une carte prévue pour un matin peut
      partir la veille au soir. Signe inversé, comme dans le thème Dawn :
      `getTimezoneOffset` compte les minutes à retrancher, Shopify attend
      celles à ajouter.
    */
    attributes.push({ key: '__shopify_offset', value: String(-new Date().getTimezoneOffset()) });
  }

  return attributes;
}

/**
 * Le destinataire d'une ligne de panier, tel qu'on l'affiche.
 *
 * Relit les attributs posés à l'ajout. Le nom ET le courriel sont montrés quand
 * les deux existent : le nom dit à qui la carte s'adresse, le courriel permet de
 * vérifier l'adresse saisie — c'est la seule erreur qu'on ne rattrape plus une
 * fois la commande passée, et le panier est le dernier endroit où la voir.
 */
export function giftRecipientLabel(attributes: CartLineAttribute[]): string | null {
  const read = (key: string) => attributes.find((a) => a.key === key)?.value.trim() ?? '';

  const name = read('Recipient name');
  const email = read('Recipient email');

  if (!email) return null;
  return name ? `${name} · ${email}` : email;
}

/** Date du jour au format attendu, pour interdire une date déjà passée. */
export function giftMinDate(): string {
  return new Date().toISOString().slice(0, 10);
}
