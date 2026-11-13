import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AccountService } from '../../core/account.service';
import { AuthService } from '../../core/auth.service';
import { extractError } from '../../core/problem';
import { formatEuros, formatIban, maskEmail } from '../../core/format';
import { buildRibPdf } from '../../core/rib-pdf';

const BIC = 'ISMAFRPPXXX';
const BANK_NAME = 'ISMA BANK';
const TRANSFER_LIMIT = 100000;
const NOTIF_KEY = 'bank.notifications';

/** Validateur de groupe : le nouveau mot de passe et sa confirmation doivent coïncider. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return next && confirm && next !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountPage {
  private readonly accounts = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly account = this.accounts.account;
  protected readonly bic = BIC;
  protected readonly bankName = BANK_NAME;
  protected readonly transferLimitLabel = formatEuros(TRANSFER_LIMIT);

  protected readonly ibanFormatted = computed(() => formatIban(this.account()?.number));
  protected readonly maskedEmail = computed(() => maskEmail(this.account()?.email));
  protected readonly openedAt = computed(() => this.formatDate(this.account()?.createdAt, false));
  protected readonly lastLogin = computed(() =>
    this.formatDate(this.account()?.lastLoginAt ?? null, true),
  );

  protected readonly ibanCopied = signal(false);

  // Sécurité — formulaire de changement de mot de passe
  protected readonly pwSubmitted = signal(false);
  protected readonly pwLoading = signal(false);
  protected readonly pwError = signal<string | null>(null);
  protected readonly pwSuccess = signal(false);
  protected readonly showPasswords = signal(false);

  protected readonly pwForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  // Préférences — notifications par e-mail (persistées localement pour la démo)
  protected readonly notifications = signal(this.readNotifications());

  constructor() {
    if (!this.accounts.account()) {
      this.accounts.load().subscribe({ error: () => {} });
    }
  }

  protected showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || this.pwSubmitted());
  }

  protected get showMismatch(): boolean {
    const confirm = this.pwForm.controls.confirmPassword;
    return (
      this.pwForm.hasError('mismatch') &&
      !confirm.hasError('required') &&
      (confirm.touched || this.pwSubmitted())
    );
  }

  protected async copyIban(): Promise<void> {
    const acc = this.account();
    if (!acc) return;
    try {
      await navigator.clipboard.writeText(acc.number);
      this.ibanCopied.set(true);
      setTimeout(() => this.ibanCopied.set(false), 1800);
    } catch {
      /* presse-papiers indisponible — ignore */
    }
  }

  protected downloadRib(): void {
    const acc = this.account();
    if (!acc) return;
    // Les accents (é, è…) et € sont valides en WinAnsi ; on évite seulement le
    // tiret cadratin (—) et l'apostrophe typographique (’), hors de cet encodage.
    const blob = buildRibPdf({
      title: "Relevé d'Identité Bancaire (RIB)",
      subtitle: `${BANK_NAME} - document généré le ${this.formatDate(new Date().toISOString(), false)}`,
      lines: [
        { label: 'Titulaire du compte', value: acc.ownerName },
        { label: 'Banque', value: BANK_NAME },
        { label: 'IBAN', value: formatIban(acc.number) },
        { label: 'BIC', value: BIC },
        { label: 'Devise', value: 'Euro (€)' },
      ],
      footer: 'Document fictif émis à des fins de démonstration - ISMA BANK.',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIB-ISMA-BANK-${acc.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected submitPassword(): void {
    this.pwSubmitted.set(true);
    this.pwSuccess.set(false);
    this.pwError.set(null);
    if (this.pwForm.invalid) {
      this.pwForm.markAllAsTouched();
      return;
    }
    this.pwLoading.set(true);
    const { currentPassword, newPassword } = this.pwForm.getRawValue();
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.pwLoading.set(false);
        this.pwSuccess.set(true);
        this.pwSubmitted.set(false);
        this.pwForm.reset();
      },
      error: (err) => {
        this.pwLoading.set(false);
        this.pwError.set(extractError(err, 'Changement de mot de passe impossible.'));
      },
    });
  }

  protected toggleNotifications(): void {
    const next = !this.notifications();
    this.notifications.set(next);
    try {
      localStorage.setItem(NOTIF_KEY, next ? '1' : '0');
    } catch {
      /* stockage indisponible — ignore */
    }
  }

  protected logout(): void {
    this.accounts.clear();
    this.auth.logout();
  }

  private readNotifications(): boolean {
    try {
      // activées par défaut tant que l'utilisateur n'a pas choisi
      return localStorage.getItem(NOTIF_KEY) !== '0';
    } catch {
      return true;
    }
  }

  private formatDate(iso: string | null | undefined, withTime: boolean): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        ...(withTime ? { timeStyle: 'short' } : {}),
      }).format(d);
    } catch {
      return d.toLocaleDateString('fr-FR');
    }
  }
}
