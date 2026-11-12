import { maskEmail } from './format';

describe('maskEmail', () => {
  it('garde la première et la dernière lettre de la partie locale, conserve le domaine', () => {
    expect(maskEmail('cherif@gmail.com')).toBe('c' + '•'.repeat(4) + 'f@gmail.com');
    expect(maskEmail('ismaelcherif2023@gmail.com')).toBe('i' + '•'.repeat(14) + '3@gmail.com');
  });

  it('gère les parties locales très courtes', () => {
    expect(maskEmail('abc@x.fr')).toBe('a•c@x.fr');
    expect(maskEmail('ab@gmail.com')).toBe('a•@gmail.com');
    expect(maskEmail('a@gmail.com')).toBe('•@gmail.com');
  });

  it('ne révèle jamais le milieu de la partie locale', () => {
    const masked = maskEmail('johndoe@example.com');
    expect(masked.startsWith('j')).toBe(true);
    expect(masked).toContain('@example.com');
    expect(masked).not.toContain('ohndo');
  });

  it('ne masque pas une valeur sans « @ » ou vide', () => {
    expect(maskEmail('pas-un-email')).toBe('pas-un-email');
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });
});
