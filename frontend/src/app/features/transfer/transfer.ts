import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { first, switchMap, timeout, timer } from 'rxjs';
import { TransferService } from '../../core/transfer.service';
import { AccountService } from '../../core/account.service';
import { Transfer } from '../../core/models';
import { extractError } from '../../core/problem';
import { formatEuros } from '../../core/format';
import { frIbanValidator, normalizeAccount } from '../../core/validators';

const POLL_INTERVAL_MS = 800;
const POLL_TIMEOUT_MS = 20000;

@Component({
  selector: 'app-transfer',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './transfer.html',
  styleUrl: './transfer.scss',
})
export class TransferPage {
  private readonly fb = inject(FormBuilder);
  private readonly transfers = inject(TransferService);
  private readonly accounts = inject(AccountService);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);
  /** `pending` pendant le polling, puis le virement final (COMPLETED/FAILED). */
  protected readonly result = signal<Transfer | null>(null);
  protected readonly pending = signal(false);
  protected readonly timedOut = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    toAccount: ['', [Validators.required, frIbanValidator]],
    amount: [
      null as number | null,
      [Validators.required, Validators.min(0.01), Validators.max(100000)],
    ],
    label: ['', [Validators.maxLength(140)]],
  });

  /** N'affiche l'erreur qu'après interaction (champ touché) ou soumission. */
  protected showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  protected euros(amount: number): string {
    return formatEuros(amount);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const toAccount = normalizeAccount(raw.toAccount); // espaces retirés avant envoi
    const amount = raw.amount;
    const label = raw.label;
    this.submitting.set(true);
    this.pending.set(false);
    this.timedOut.set(false);
    this.error.set(null);
    this.result.set(null);

    this.transfers
      .create({ toAccount, amount: amount as number, label: label || undefined })
      .subscribe({
        next: (created) => {
          // 202 Accepted → le virement est PENDING, on suit son statut.
          this.submitting.set(false);
          this.pending.set(true);
          this.result.set(created);
          this.poll(created.id);
        },
        error: (err) => {
          this.error.set(extractError(err, "Le virement n'a pas pu être créé."));
          this.submitting.set(false);
        },
      });
  }

  /** Rafraîchit le statut jusqu'à ce qu'il ne soit plus PENDING, puis met le solde à jour. */
  private poll(id: string): void {
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.transfers.get(id)),
        first((t) => t.status !== 'PENDING'),
        timeout(POLL_TIMEOUT_MS),
      )
      .subscribe({
        next: (final) => {
          this.result.set(final);
          this.pending.set(false);
          this.accounts.load().subscribe({ error: () => {} });
        },
        error: () => {
          // Dépassement de délai : le virement reste en traitement côté serveur.
          this.pending.set(false);
          this.timedOut.set(true);
          this.accounts.load().subscribe({ error: () => {} });
        },
      });
  }

  protected reset(): void {
    this.form.reset({ toAccount: '', amount: null, label: '' });
    this.result.set(null);
    this.error.set(null);
    this.timedOut.set(false);
    this.submitted.set(false);
  }
}
