import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is unauthenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
  });

  it('stores token and account number after login', () => {
    service.login({ email: 'alice@example.com', password: 'secret12' }).subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-123', accountNumber: 'FR7612345' });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('jwt-123');
    expect(service.accountNumber()).toBe('FR7612345');
    expect(localStorage.getItem('bank.token')).toBe('jwt-123');
  });

  it('persists token through register as well', () => {
    service
      .register({ fullName: 'Bob', email: 'bob@example.com', password: 'secret12' })
      .subscribe();
    http.expectOne('/api/auth/register').flush({ token: 'jwt-reg', accountNumber: 'FR76999' });

    expect(service.token()).toBe('jwt-reg');
  });

  it('clears the session on logout', () => {
    service.login({ email: 'alice@example.com', password: 'secret12' }).subscribe();
    http.expectOne('/api/auth/login').flush({ token: 'jwt-123', accountNumber: 'FR76' });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('bank.token')).toBeNull();
    expect(localStorage.getItem('bank.account')).toBeNull();
  });
});
