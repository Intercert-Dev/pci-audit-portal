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
import { TotalActiveClientList } from './total-active-client-list/total-active-client-list';
import { TotalClientList } from './total-client-list/total-client-list';
import { SuspendedClientList } from './suspended-client-list/suspended-client-list';
import { TotalCertificationList } from './total-certification-list/total-certification-list';
import { AddAudit } from './add-audit/add-audit';
import { ReportVerification } from './report-verification/report-verification';
import { QsaList } from './qsa-list/qsa-list';
import { EditAsvClient } from './edit-asv-client/edit-asv-client';
import { AddAsvAudit } from './add-asv-audit/add-asv-audit';
import { AsvAuditClientList } from './asv-audit-client-list/asv-audit-client-list';
import { AuditList } from './audit-list/audit-list';
import { PciReportsList } from './pci-reports-list/pci-reports-list';
import { CurrentPendingClients } from './current-pending-clients/current-pending-clients';
import { NextMonthPendingClientsList } from './next-month-pending-clients-list/next-month-pending-clients-list';


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
      { path: 'add-audit', component: AddAudit },
      { path: 'add-asv-audit', component: AddAsvAudit },
      { path: 'asv-dashboard', component: AsvAudit },
      { path: 'report-verification', component: ReportVerification },
      { path: 'asv-audit', component: AsvAudit },
      { path: 'certificate-gen', component: CertificateGen },
      { path: 'create-user', component: CreateUser },
      { path: 'asv-client-list', component: AsvClientList},
      { path: 'user-list', component: UserList},
      { path: 'user-profile', component: Profile},
      { path: 'user-settings', component: Settings},
      { path: 'upcoming-audit-list', component: TotalUpcomingAuditList},
      { path: 'total-Client-list', component: TotalClientList},
      { path: 'total-active-client-list', component: TotalActiveClientList},
      { path: 'total-suspended-client-list', component: SuspendedClientList},
      { path: 'total-certificated-client-list', component: TotalCertificationList},
      { path: 'qsa-list', component: QsaList},
      { path: 'edit-asv-list', component: EditAsvClient},
      { path: 'asv-audit-client-list',  component: AsvAuditClientList},
      { path: 'audit-list',  component: AuditList},
      { path: 'pci-reports-list',  component: PciReportsList},
      { path: 'current-pending-clients',  component: CurrentPendingClients},
      { path: 'next-month-pending-clients',  component: NextMonthPendingClientsList},
    ],
  },
  { path: '**', redirectTo: 'dashboard' }
];
