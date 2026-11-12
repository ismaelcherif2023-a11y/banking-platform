import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AccountService } from '../../core/account.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly accounts = inject(AccountService);

  protected readonly account = this.accounts.account;
  protected readonly menuOpen = signal(false);

  constructor() {
    // Charge le compte dès l'entrée dans l'espace privé (si pas déjà en cache).
    if (!this.accounts.account()) {
      this.accounts.load().subscribe({ error: () => {} });
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected logout(): void {
    this.accounts.clear();
    this.auth.logout();
  }
}
