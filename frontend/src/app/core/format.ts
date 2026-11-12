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
