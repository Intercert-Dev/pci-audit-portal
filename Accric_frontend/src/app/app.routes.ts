import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { MainLayout } from './main-layout/main-layout';
import { AddClient } from './add-client/add-client';
import { ClientList } from './client-list/client-list';
import { AsvAudit } from './asv-audit/asv-audit';
import { CertificateGen } from './certificate-gen/certificate-gen';


export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'add-client', component: AddClient },
      { path: 'client-list', component: ClientList },
      { path: 'asv-audit', component: AsvAudit },
      { path: 'certificate-gen', component: CertificateGen },

      // add more routes here (add-client, cif, etc.)
    ],
  },
  {path : 'login',component : Login}
];
