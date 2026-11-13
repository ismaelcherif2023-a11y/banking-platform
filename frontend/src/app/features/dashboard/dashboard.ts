import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { extractError } from '../../core/problem';
import { formatEuros } from '../../core/format';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly accounts = inject(AccountService);

  protected readonly account = this.accounts.account;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal(false);

  protected readonly balanceLabel = computed(() => {
    const acc = this.account();
    return acc ? formatEuros(acc.balance) : '-';
  });

  constructor() {
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.accounts.load().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(extractError(err));
        this.loading.set(false);
      },
    });
  }

  protected async copyNumber(): Promise<void> {
    const acc = this.account();
    if (!acc) return;
    try {
      await navigator.clipboard.writeText(acc.number);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* clipboard indisponible : on ignore */
    }
  }
}
