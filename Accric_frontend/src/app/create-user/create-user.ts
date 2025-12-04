import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
}

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css']
})
export class CreateUser {
  dropdownOpen = false;
  selectedRole: string | null = null;
  roles = Object.values(Role);
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private router : Router) { }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectRole(role: string) {
    this.selectedRole = role;
    this.dropdownOpen = false;
  }

  // Close dropdown when clicking outside (you can implement this if needed)
  onClickOutside(event: Event) {
    if (!(event.target as Element).closest('.custom-select')) {
      this.dropdownOpen = false;
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid || !this.selectedRole) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.message = '';

    const formData = {
      name: form.value.name,
      email: form.value.email,
      password: "Intercert@2025",
      role: this.selectedRole
    };

    // Get JWT token from localStorage
    const token = localStorage.getItem('jwt');
    if (!token) {
      this.message = 'Authentication token not found. Please login again.';
      this.messageType = 'error';
      this.isLoading = false;
      return;
    }

    // Set headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Make API call
    this.http.post(
      'http://pci.accric.com/api/auth/create-user',
      formData,
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('User created successfully:', response);
        this.message = 'User created successfully!';
        this.messageType = 'success';
        this.isLoading = false;

        // Properly reset form + validation + submitted state
        form.resetForm();
        this.selectedRole = null;
        this.router.navigate(['/user-list']);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.message = error.error?.message || 'Failed to create user. Please try again.';
        this.messageType = 'error';
        this.isLoading = false;
      }
    });
  }
}