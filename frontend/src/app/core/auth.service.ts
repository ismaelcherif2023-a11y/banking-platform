import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from './models';

const TOKEN_KEY = 'bank.token';
const ACCOUNT_KEY = 'bank.account';

/**
 * Détient l'état d'authentification sous forme de signals.
 * Le JWT est persisté dans localStorage pour survivre à un rechargement.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.read(TOKEN_KEY));
  private readonly _accountNumber = signal<string | null>(this.read(ACCOUNT_KEY));

  readonly token = this._token.asReadonly();
  readonly accountNumber = this._accountNumber.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', body).pipe(tap((r) => this.store(r)));
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', body).pipe(tap((r) => this.store(r)));
  }

  /** Efface la session et renvoie vers la page de connexion. */
  logout(): void {
    this._token.set(null);
    this._accountNumber.set(null);
    this.remove(TOKEN_KEY);
    this.remove(ACCOUNT_KEY);
    void this.router.navigate(['/login']);
  }

  private store(r: AuthResponse): void {
    this._token.set(r.token);
    this._accountNumber.set(r.accountNumber);
    this.write(TOKEN_KEY, r.token);
    this.write(ACCOUNT_KEY, r.accountNumber);
  }

  // Accès localStorage défensif (mode privé, stockage bloqué...).
  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
