import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => ctrl.verify());

  function authenticate(): void {
    auth.login({ email: 'a@b.com', password: 'secret12' }).subscribe();
    ctrl.expectOne('/api/auth/login').flush({ token: 'jwt-xyz', accountNumber: 'FR76' });
  }

  it('adds a Bearer header to protected requests when authenticated', () => {
    authenticate();

    http.get('/api/accounts/me').subscribe();
    const req = ctrl.expectOne('/api/accounts/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-xyz');
    req.flush({});
  });

  it('does not attach the token to /api/auth endpoints', () => {
    authenticate();

    http.post('/api/auth/login', {}).subscribe();
    const req = ctrl.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 't', accountNumber: 'x' });
  });

  it('does not attach a header when there is no token', () => {
    http.get('/api/accounts/me').subscribe({ error: () => {} });
    const req = ctrl.expectOne('/api/accounts/me');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs the user out on a 401 response', () => {
    authenticate();
    const spy = vi.spyOn(auth, 'logout');

    http.get('/api/accounts/me').subscribe({ error: () => {} });
    ctrl.expectOne('/api/accounts/me').flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
