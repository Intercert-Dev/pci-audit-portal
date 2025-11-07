import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { Overview } from './overview/overview';
import { MainLayout } from './main-layout/main-layout';
import { AddClient } from './add-client/add-client';


export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'add-client', component: AddClient },

      // add more routes here (add-client, cif, etc.)
    ],
  },
  {path : 'login',component : Login}
];
