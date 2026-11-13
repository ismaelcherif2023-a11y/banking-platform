import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register : confirmation du mot de passe et conditions', () => {
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

  async function setup() {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Register);
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const set = (selector: string, value: string) => {
      const input = el.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };

    return { http, fixture, el, set };
  }

  it('refuse la soumission quand les mots de passe diffèrent', async () => {
    const { http, fixture, el, set } = await setup();

    set('#fullName', 'Alice Martin');
    set('#email', 'alice@example.com');
    set('#password', 'motdepasse1');
    set('#confirmPassword', 'motdepasse2');
    (el.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(el.textContent).toContain('ne correspondent pas');
    http.expectNone('/api/auth/register');
  });

  it("exige l'acceptation des conditions d'utilisation", async () => {
    const { http, fixture, el, set } = await setup();

    set('#fullName', 'Alice Martin');
    set('#email', 'alice@example.com');
    set('#password', 'motdepasse1');
    set('#confirmPassword', 'motdepasse1');
    // conditions NON cochées

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(el.textContent).toContain("accepter les conditions");
    http.expectNone('/api/auth/register');
  });

  it('envoie la requête quand tout est valide et cohérent', async () => {
    const { http, fixture, el, set } = await setup();

    set('#fullName', 'Alice Martin');
    set('#email', 'alice@example.com');
    set('#password', 'motdepasse1');
    set('#confirmPassword', 'motdepasse1');
    (el.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fullName: 'Alice Martin',
      email: 'alice@example.com',
      password: 'motdepasse1',
    });
    req.flush({ token: 't', accountNumber: 'FR76' });
  });
});
