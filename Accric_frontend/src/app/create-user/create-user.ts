import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

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

