import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login : affichage des erreurs', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', children: [] }]),
      ],
    });
  });

  it("n'affiche aucune erreur ni bordure rouge au chargement", async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('input.invalid').length).toBe(0);
    expect(el.textContent).not.toContain('requise');
    expect(el.textContent).not.toContain('requis');
  });

  it('affiche les erreurs après une soumission invalide', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('input.invalid').length).toBeGreaterThan(0);
    expect(el.textContent).toContain('requis');
  });

  it('le bouton œil bascule le type du champ mot de passe', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const pwd = el.querySelector('#password') as HTMLInputElement;
    const toggle = el.querySelector('.password-toggle') as HTMLButtonElement;

    expect(toggle.getAttribute('type')).toBe('button');
    expect(toggle.getAttribute('aria-label')).toContain('Afficher');
    expect(pwd.type).toBe('password');

    toggle.click();
    fixture.detectChanges();

    expect(pwd.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toContain('Masquer');
  });
});

describe("Login : mémorisation de l'identifiant", () => {
  const REMEMBER_KEY = 'bank.remember-email';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', children: [] }]),
      ],
    });
  });

  afterEach(() => localStorage.clear());

  async function fillAndSubmit(email: string, password: string, remember: boolean) {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emailInput = el.querySelector('#email') as HTMLInputElement;
    const pwdInput = el.querySelector('#password') as HTMLInputElement;
    const check = el.querySelector('.auth__check input') as HTMLInputElement;

    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    pwdInput.value = password;
    pwdInput.dispatchEvent(new Event('input'));
    // Aligne la case sur l'état voulu (le constructeur a pu la pré-cocher).
    if (check.checked !== remember) {
      check.click();
    }
    fixture.detectChanges();

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    http.expectOne('/api/auth/login').flush({ token: 't', accountNumber: 'FR76' });
    return { http };
  }

  it("mémorise l'identifiant quand la case est cochée", async () => {
    await fillAndSubmit('client@isma.test', 'motdepasse1', true);
    expect(localStorage.getItem(REMEMBER_KEY)).toBe('client@isma.test');
  });

  it("n'enregistre jamais le mot de passe", async () => {
    await fillAndSubmit('client@isma.test', 'motdepasse1', true);
    const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k));
    expect(stored).not.toContain('motdepasse1');
  });

  it("oublie l'identifiant quand la case n'est pas cochée", async () => {
    localStorage.setItem(REMEMBER_KEY, 'ancien@isma.test');
    await fillAndSubmit('client@isma.test', 'motdepasse1', false);
    expect(localStorage.getItem(REMEMBER_KEY)).toBeNull();
  });

  it("pré-remplit l'identifiant mémorisé au chargement", async () => {
    localStorage.setItem(REMEMBER_KEY, 'retour@isma.test');
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    fixture.detectChanges();
    const email = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    expect(email.value).toBe('retour@isma.test');
  });
});
