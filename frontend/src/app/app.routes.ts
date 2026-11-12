import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion — Nova Bank',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Inscription — Nova Bank',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        title: 'Tableau de bord — Nova Bank',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'transfer',
        title: 'Nouveau virement — Nova Bank',
        loadComponent: () => import('./features/transfer/transfer').then((m) => m.TransferPage),
      },
      {
        path: 'history',
        title: 'Historique — Nova Bank',
        loadComponent: () => import('./features/history/history').then((m) => m.History),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
