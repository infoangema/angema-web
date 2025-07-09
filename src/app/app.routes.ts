import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RootGuard } from './core/guards/root.guard';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { firebaseConfig } from './config/firebase.config';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'app/login',
    pathMatch: 'full'
  },
  {
    path: 'app',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./modules/stockin-manager/pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'complete-profile',
        loadComponent: () => import('./modules/stockin-manager/pages/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent)
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        canActivate: [AuthGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/products/products.page').then(m => m.StockinProductsPage)
      },
      {
        path: 'orders',
        canActivate: [AuthGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/orders/orders.page').then(m => m.StockinOrdersPage)
      },
      {
        path: 'customers',
        canActivate: [AuthGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/customers/customers.page').then(m => m.StockinCustomersPage)
      },
      {
        path: 'reports',
        canActivate: [AuthGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/reports/reports.page').then(m => m.StockinReportsPage)
      },
      {
        path: 'root-admin',
        canActivate: [AuthGuard, RootGuard],
        loadComponent: () => import('./modules/stockin-manager/pages/root-admin/root-admin.component').then(m => m.RootAdminComponent)
      }
    ]
  }
];

export const appProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions()),
  provideStorage(() => getStorage())
];
