import { Routes } from '@angular/router';
import { adminGuard, companyGuard, guestGuard } from './core/auth/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [companyGuard],
    loadComponent: () =>
      import('./features/company/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'obligations',
    canActivate: [companyGuard],
    loadComponent: () =>
      import('./features/company/obligations.component').then(
        (m) => m.ObligationsComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'admin/red',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/network.component').then(
        (m) => m.NetworkComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
