import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Endpoints d'authentification « publics » : ni jeton ni déconnexion auto.
const isPublicAuthEndpoint = (url: string): boolean =>
  url.includes('/api/auth/login') || url.includes('/api/auth/register');
// Tous les endpoints /api/auth/ : un 401 n'y signifie pas « session expirée ».
const isAuthEndpoint = (url: string): boolean => url.includes('/api/auth/');

/**
 * - Ajoute `Authorization: Bearer <token>` sur les appels /api protégés,
 *   y compris `/api/auth/password` (changement de mot de passe), mais jamais
 *   sur la connexion / l'inscription.
 * - Déconnecte automatiquement l'utilisateur sur une réponse 401
 *   (token expiré ou invalide), sauf sur les endpoints d'authentification :
 *   un mot de passe actuel erroné ne doit pas fermer la session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const authReq =
    token && req.url.startsWith('/api') && !isPublicAuthEndpoint(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint(req.url)) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
