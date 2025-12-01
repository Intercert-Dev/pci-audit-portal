import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// Import child components (standalone)
import { UserList } from '../user-list/user-list';
import { ManageQSA } from '../manage-qsa/manage-qsa';

interface SettingsSection {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserList,
    ManageQSA,
    // RolePermissionComponent
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {

  // Default active tab
  activeSection: string = 'manageUsers';

  // Sidebar sections
  settingsSections: SettingsSection[] = [
    { id: 'manageUsers', name: 'Manage Users', icon: 'icon-users' },
    { id: 'manageQsa', name: 'Manage QSA', icon: 'icon-briefcase' },
    { id: 'rolesPermissions', name: 'Role & Permission', icon: 'icon-lock' }
  ];

  constructor() {}

  // Change active sidebar tab
  setActiveSection(sectionId: string) {
    this.activeSection = sectionId;
  }
}
