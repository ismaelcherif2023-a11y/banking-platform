import { FormControl } from '@angular/forms';
import { frIbanValidator, isValidFrIban, normalizeAccount } from './validators';

describe('validators — compte bénéficiaire (IBAN FR)', () => {
  const VALID = 'FR7630001007941234567890185'; // FR76 + 23 chiffres

  it('normalise en retirant les espaces et en majuscules', () => {
    expect(normalizeAccount('  fr76 3000 1007 9412 3456 7890 185 ')).toBe(VALID);
  });

  it('accepte un IBAN FR valide', () => {
    expect(isValidFrIban(VALID)).toBe(true);
  });

  it('accepte un IBAN FR valide avec des espaces', () => {
    expect(isValidFrIban('FR76 3000 1007 9412 3456 7890 185')).toBe(true);
  });

  it('refuse une adresse e-mail', () => {
    expect(isValidFrIban('alice@example.com')).toBe(false);
  });

  it('refuse un IBAN trop court ou d’un autre pays', () => {
    expect(isValidFrIban('FR7612')).toBe(false);
    expect(isValidFrIban('DE7630001007941234567890185')).toBe(false);
    expect(isValidFrIban('FR76ABCDEFGHIJKLMNOPQRSTUVW')).toBe(false);
  });

  it('validateur : null si valide, { frIban: true } si invalide, null si vide', () => {
    expect(frIbanValidator(new FormControl(VALID))).toBeNull();
    expect(frIbanValidator(new FormControl('pas-un-iban'))).toEqual({ frIban: true });
    expect(frIbanValidator(new FormControl(''))).toBeNull();
  });
});
