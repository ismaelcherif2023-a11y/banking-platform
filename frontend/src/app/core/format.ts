/**
 * Formate un IBAN par groupes de 4 caractères, comme sur un RIB.
 * Supprime les espaces existants et met en majuscules.
 * Exemple : « FR7612345678901234567890123 » -> « FR76 1234 5678 9012 3456 7890 123 ».
 */
export function formatIban(iban: string | null | undefined): string {
  const compact = (iban ?? '').replace(/\s+/g, '').toUpperCase();
  if (!compact) return '';
  return compact.replace(/(.{4})/g, '$1 ').trim();
}

/** Formate un montant en euros, format français : 1 000,00 €. */
export function formatEuros(amount: number): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
}

/**
 * Masque un e-mail : garde la première et la dernière lettre de la partie locale,
 * remplace le reste par des points, conserve le domaine.
 * Exemple : « cherif@gmail.com » -> « c••••f@gmail.com ».
 */
export function maskEmail(email: string | null | undefined): string {
  const value = (email ?? '').trim();
  const at = value.indexOf('@');
  if (at <= 0) {
    return value; // pas d'e-mail exploitable : rien à masquer
  }
  const local = value.slice(0, at);
  const domain = value.slice(at); // inclut le « @ »

  if (local.length === 1) {
    return '•' + domain;
  }
  if (local.length === 2) {
    return local[0] + '•' + domain;
  }
  return local[0] + '•'.repeat(local.length - 2) + local[local.length - 1] + domain;
}
