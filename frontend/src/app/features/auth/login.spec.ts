import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login — affichage des erreurs', () => {
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
    expect(el.textContent).toContain('requise');
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
