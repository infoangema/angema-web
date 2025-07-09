import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RootGuard } from '../../core/guards/root.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/app/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then(m => m.StockinProductsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.page').then(m => m.StockinOrdersPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./pages/customers/customers.page').then(m => m.StockinCustomersPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then(m => m.StockinReportsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'root-admin',
    loadComponent: () => import('./pages/root-admin/root-admin.component').then(m => m.RootAdminComponent),
    canActivate: [AuthGuard, RootGuard]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class StockinManagerModule { } 