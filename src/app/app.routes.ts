import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadChildren: () => import('./modules/marketing/marketing.module').then(m => m.MarketingModule),
    pathMatch: 'full' 
  },
  { 
    path: 'app', 
    loadChildren: () => import('./modules/stockin-manager/stockin-manager.module').then(m => m.StockinManagerModule)
  },
  { path: '**', redirectTo: '/' }
];
