import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs';
import { AuthService } from './auth.service';

type GuardResult = boolean | UrlTree | Observable<boolean | UrlTree>;

function loadUserOrRedirect(): GuardResult {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token) return router.createUrlTree(['/login']);
  if (auth.currentUser()) return true;
  return auth.loadCurrentUser().pipe(
    map(() => true as boolean | UrlTree),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
}

export const authGuard: CanActivateFn = () => loadUserOrRedirect();

function roleGuard(role: 'ADMIN' | 'COMPANY', fallback: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const checkRole = (): boolean | UrlTree =>
      auth.currentUser()?.role === role ? true : router.createUrlTree([fallback]);
    const result = loadUserOrRedirect();
    if (result instanceof Observable) {
      return result.pipe(map((r) => (r === true ? checkRole() : r)));
    }
    return result === true ? checkRole() : result;
  };
}

export const adminGuard = roleGuard('ADMIN', '/dashboard');
export const companyGuard = roleGuard('COMPANY', '/admin');

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token) return true;
  if (auth.currentUser()) {
    return router.createUrlTree([auth.isAdmin() ? '/admin' : '/dashboard']);
  }
  return auth.loadCurrentUser().pipe(
    map(() => router.createUrlTree([auth.isAdmin() ? '/admin' : '/dashboard'])),
    catchError(() => of(true)),
  );
};
