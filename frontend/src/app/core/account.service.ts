import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Account } from './models';

/** Charge et met en cache (signal) le compte de l'utilisateur connecté. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  readonly account = signal<Account | null>(null);

  load(): Observable<Account> {
    return this.http.get<Account>('/api/accounts/me').pipe(tap((a) => this.account.set(a)));
  }

  clear(): void {
    this.account.set(null);
  }
}
