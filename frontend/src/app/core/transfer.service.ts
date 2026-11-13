import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTransferRequest, Transfer } from './models';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly http = inject(HttpClient);

  /** Crée un virement : réponse 202, statut initial PENDING. */
  create(body: CreateTransferRequest): Observable<Transfer> {
    return this.http.post<Transfer>('/api/transfers', body);
  }

  /** Historique (virements émis et reçus). */
  list(): Observable<Transfer[]> {
    return this.http.get<Transfer[]>('/api/transfers');
  }

  get(id: string): Observable<Transfer> {
    return this.http.get<Transfer>(`/api/transfers/${id}`);
  }
}
