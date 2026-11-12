import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const isAuthEndpoint = (url: string): boolean => url.includes('/api/auth/');

/**
 * - Ajoute `Authorization: Bearer <token>` sur les appels /api protégés.
 * - Déconnecte automatiquement l'utilisateur sur une réponse 401
 *   (token expiré ou invalide), sauf sur les endpoints d'authentification.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const authReq =
    token && req.url.startsWith('/api') && !isAuthEndpoint(req.url)
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
