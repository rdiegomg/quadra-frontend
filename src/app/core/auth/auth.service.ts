import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

const TOKEN_KEY = 'quadra_token';

export interface RegisterPayload {
  company_name: string;
  nit: string;
  legal_type: string;
  sector_id: number;
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  private readonly currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<TokenResponse> {
    const body = new URLSearchParams({ username: email, password });
    return this.http
      .post<TokenResponse>(`${this.api}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap(({ access_token }) => {
          localStorage.setItem(TOKEN_KEY, access_token);
        }),
      );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${this.api}/auth/register`, payload);
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.api}/auth/me`)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  redirectAfterLogin(): void {
    const user = this.currentUserSignal();
    this.router.navigate([user?.role === 'ADMIN' ? '/admin' : '/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
