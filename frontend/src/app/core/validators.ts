import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Retire les espaces d'un numéro de compte et met en majuscules. */
export function normalizeAccount(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

/** IBAN français (simplifié) : FR76 suivi de 23 chiffres, espaces tolérés. */
export function isValidFrIban(value: string | null | undefined): boolean {
  return /^FR76\d{23}$/.test(normalizeAccount(value));
}

/** Validateur de formulaire associé ; `required` gère le cas vide. */
export function frIbanValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value as string;
  if (!raw || !raw.trim()) {
    return null;
  }
  return isValidFrIban(raw) ? null : { frIban: true };
}
