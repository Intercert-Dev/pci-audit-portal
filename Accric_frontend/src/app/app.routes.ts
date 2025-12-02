import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { MainLayout } from './main-layout/main-layout';
import { AddClient } from './add-client/add-client';
import { ClientList } from './client-list/client-list';
import { AsvAudit } from './asv-audit/asv-audit';
import { CertificateGen } from './certificate-gen/certificate-gen';
import { AuthGuard } from './service/Guard/auth.Guard';
import { CreateUser } from './create-user/create-user';
import { AsvClientList } from './asv-client-list/asv-client-list';
import { UserList } from './user-list/user-list';
import { Profile } from './profile/profile';
import { Settings } from './settings/settings';
import { TotalUpcomingAuditList } from './total-upcoming-audit-list/total-upcoming-audit-list';


export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'add-client', component: AddClient },
      { path: 'client-list', component: ClientList },
      { path: 'asv-audit', component: AsvAudit },
      { path: 'certificate-gen', component: CertificateGen },
      { path: 'create-user', component: CreateUser },
      { path: 'asv-client-list', component: AsvClientList},
      { path: 'user-list', component: UserList},
      { path: 'user-profile', component: Profile},
      { path: 'user-settings', component: Settings},
      { path: 'upcoming-audit-list', component: TotalUpcomingAuditList},

    ],
  },
  { path: '**', redirectTo: 'dashboard' }
];
