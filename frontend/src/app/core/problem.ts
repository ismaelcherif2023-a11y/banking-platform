import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from './models';

/**
 * Extrait un message lisible depuis une erreur HTTP.
 * Gère le format RFC 7807 (ProblemDetail) renvoyé par le backend,
 * ainsi que les erreurs de validation Spring (champ `detail` / `title`).
 */
export function extractError(err: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Serveur injoignable. Vérifiez votre connexion et réessayez.';
    }
    const body = err.error as ProblemDetail | string | null;
    if (body && typeof body === 'object') {
      if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
      if (typeof body.title === 'string' && body.title.trim()) return body.title;
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (err.status === 401) return 'Identifiants invalides.';
  }
  return fallback;
}
