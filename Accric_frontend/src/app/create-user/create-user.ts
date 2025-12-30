import { CommonModule } from '@angular/common';
import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../service/toast-service';

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
  @ViewChild('roleDropdown') roleDropdown!: ElementRef;
  
  dropdownOpen = false;
  selectedRole: string | null = null;
  roles = Object.values(Role);
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  formSubmitted = false;

  constructor(private http: HttpClient, private toast:ToastService,
    private router: Router, private el: ElementRef) { }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectRole(role: string) {
    this.selectedRole = role;
    this.dropdownOpen = false;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const dropdownElement = this.roleDropdown?.nativeElement;
    
    // Close dropdown if click is outside the dropdown element
    if (dropdownElement && !dropdownElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }

  // Close dropdown on mouse leave from the dropdown options area
  closeDropdown() {
    this.dropdownOpen = false;
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;
    
    if (form.invalid || !this.selectedRole) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
        control.markAsDirty();
      });
      
      // Add error class to role dropdown if no role selected
      if (!this.selectedRole) {
        setTimeout(() => {
          const roleElement = this.el.nativeElement.querySelector('.custom-select');
          if (roleElement) {
            roleElement.classList.add('error-border');
          }
        }, 0);
      }
      
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
      this.toast.error('Authentication token not found. Please login again.')
      return;
    }

    // Set headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    // Make API call
    this.http.post(
      'https://pci.accric.com/api/auth/create-user',
      formData,
      { headers }
    ).subscribe({
      next: (response: any) => {
        
        this.toast.success('User created successfully')
        this.isLoading = false;

        // Properly reset form + validation + submitted state
        form.resetForm();
        this.selectedRole = null;
        this.formSubmitted = false;
        
        // Remove error class from role dropdown
        const roleElement = this.el.nativeElement.querySelector('.custom-select');
        if (roleElement) {
          roleElement.classList.remove('error-border');
        }
        
        this.router.navigate(['/user-list']);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.toast.error(error.message || 'Failed to create user. Please try again.')
        this.isLoading = false;
      }
    });
  }

  // Remove error border when user selects a role
  onRoleSelected() {
    const roleElement = this.el.nativeElement.querySelector('.custom-select');
    if (roleElement) {
      roleElement.classList.remove('error-border');
    }
  }
}