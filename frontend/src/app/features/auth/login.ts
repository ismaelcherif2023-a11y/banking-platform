import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { extractError } from '../../core/problem';

/** Clé localStorage pour mémoriser uniquement l'identifiant (jamais le mot de passe). */
const REMEMBER_KEY = 'bank.remember-email';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly remember = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    // Pré-remplit l'identifiant mémorisé lors d'une précédente visite.
    const saved = this.readRemembered();
    if (saved) {
      this.form.controls.email.setValue(saved);
      this.remember.set(true);
    }
  }

  /** N'affiche l'erreur qu'après interaction (champ touché) ou soumission. */
  protected showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.persistRemembered();
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(extractError(err, 'Connexion impossible.'));
        this.loading.set(false);
      },
    });
  }

  /** Mémorise (ou oublie) l'identifiant selon la case cochée. Jamais le mot de passe. */
  private persistRemembered(): void {
    try {
      if (this.remember()) {
        localStorage.setItem(REMEMBER_KEY, this.form.controls.email.value);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* stockage indisponible : on ignore */
    }
  }

  private readRemembered(): string | null {
    try {
      return localStorage.getItem(REMEMBER_KEY);
    } catch {
      return null;
    }
  }
}
