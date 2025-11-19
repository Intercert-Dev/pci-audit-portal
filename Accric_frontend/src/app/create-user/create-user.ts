import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
  REVIEWER = 'REVIEWER',
  VERIFIER = 'VERIFIER',
  CLIENT = 'CLIENT',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  CLIENT_ANALYST = 'CLIENT_ANALYST',
  CLIENT_AUDITOR = 'CLIENT_AUDITOR',
  CLIENT_REVIEWER = 'CLIENT_REVIEWER',
}


@Component({
  selector: 'app-create-user',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})

export class CreateUser {

  dropdownOpen = false;
  selectedRole: string | null = null;

  roles = Object.values(Role);
  
  constructor() { }

   toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectRole(role: string) {
    this.selectedRole = role;
    this.dropdownOpen = false;
  }

  // Close dropdown if clicked outside (optional)
  onClickOutside() {
    this.dropdownOpen = false;
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }
    const formData = form.value;
    console.log("User Created:", formData);
    form.reset();
  }
}

