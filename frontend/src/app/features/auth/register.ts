import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { extractError } from '../../core/problem';

/** Le mot de passe et sa confirmation doivent coïncider. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  /** N'affiche l'erreur qu'après interaction (champ touché) ou soumission. */
  protected showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  /** Erreur de non-correspondance, une fois la confirmation renseignée. */
  protected get showMismatch(): boolean {
    const confirm = this.form.controls.confirmPassword;
    return (
      this.form.hasError('mismatch') &&
      !confirm.hasError('required') &&
      (confirm.touched || this.submitted())
    );
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { fullName, email, password } = this.form.getRawValue();
    this.auth.register({ fullName, email, password }).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(extractError(err, 'Inscription impossible.'));
        this.loading.set(false);
      },
    });
  }
}
