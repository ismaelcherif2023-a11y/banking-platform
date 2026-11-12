import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TransferService } from '../../core/transfer.service';
import { AuthService } from '../../core/auth.service';
import { Transfer } from '../../core/models';
import { extractError } from '../../core/problem';

interface TransferRow extends Transfer {
  outgoing: boolean;
}

@Component({
  selector: 'app-history',
  imports: [RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly transfers = inject(TransferService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly items = signal<Transfer[]>([]);

  /** Enrichit chaque virement avec son sens (émis/reçu) et trie du plus récent au plus ancien. */
  protected readonly rows = computed<TransferRow[]>(() => {
    const me = this.auth.accountNumber();
    return [...this.items()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((t) => ({ ...t, outgoing: t.fromAccount === me }));
  });

  constructor() {
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.transfers.list().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractError(err));
        this.loading.set(false);
      },
    });
  }

  protected amountLabel(t: TransferRow): string {
    const sign = t.outgoing ? '−' : '+';
    return `${sign} ${t.amount.toFixed(2)} €`;
  }

  protected date(iso: string): string {
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  protected counterparty(t: TransferRow): string {
    return t.outgoing ? t.toAccount : t.fromAccount;
  }
}
