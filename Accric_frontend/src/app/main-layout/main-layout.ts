import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayout implements OnInit {

  isSidebarOpen = true;
  dropdownOpen = false;
  isClientsExpanded = false;
  userRole: string = '';
  userEmail: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects || event.url;
        const isSubmenuRoute = this.isClientsSubmenuRoute(currentUrl);

        if (!isSubmenuRoute) {
          this.isClientsExpanded = false;
        }
      });
  }

  ngOnInit() {
    this.decodeJWTAndSetUserInfo();
  }

  // JWT Decoding Function
  private decodeJWT(token: string): any {
    try {
      // Split the token into parts
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      // Decode the payload (second part)
      const payload = parts[1];
      
      // Base64URL decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  private decodeJWTAndSetUserInfo(): void {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      console.warn('No JWT token found in localStorage');
      this.userRole = '';
      this.userEmail = '';
      return;
    }

    const decoded = this.decodeJWT(token);
    
    if (decoded) {
      // Set user role from JWT
      this.userRole = decoded.role || '';
      this.userEmail = decoded.email || '';
      
      // Also store in localStorage for backward compatibility
      localStorage.setItem('userRole', this.userRole);
      localStorage.setItem('userEmail', this.userEmail);
      
      console.log('User Information from JWT:');
      console.log('Role:', this.userRole);
      console.log('Email:', this.userEmail);
      
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          console.warn('WARNING: JWT token has EXPIRED!');
          // You might want to handle token expiration here
          // For example, redirect to login or refresh the token
        } else {
          console.log('✓ Token is valid');
          console.log('Expires At:', new Date(decoded.exp * 1000).toLocaleString());
        }
      }
    } else {
      // Fallback to localStorage if JWT decoding fails
      this.userRole = localStorage.getItem('userRole') || '';
      this.userEmail = localStorage.getItem('userEmail') || '';
    }
  }

  // Optional: Add a method to get user info anytime
  getUserInfo() {
    return {
      role: this.userRole,
      email: this.userEmail,
      isAdmin: this.userRole === 'SUPER_ADMIN' || this.userRole === 'ADMIN'
    };
  }

  // Optional: Check if user has specific role
  hasRole(requiredRole: string): boolean {
    return this.userRole === requiredRole;
  }

  // Optional: Check if user has any of the given roles
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.userRole);
  }

  private isClientsSubmenuRoute(url: string): boolean {
    const clientsSubmenuRoutes = [
      '/add-client',
      '/add-audit',
      '/add-asv-audit',
      '/report-verification'
    ];

    return clientsSubmenuRoutes.some(route => url.startsWith(route));
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  toggleClientsMenu(event: Event) {
    event.stopPropagation();
    this.isClientsExpanded = !this.isClientsExpanded;
  }

  closeClientsMenu() {
    this.isClientsExpanded = false;
  }

  onMainMenuItemClick() {
    this.closeClientsMenu();
    this.closeDropdown();
  }

  onSubmenuItemClick() {
    this.closeDropdown();
  }

  goToProfile(event: Event) {
    event.stopPropagation();
    this.onMainMenuItemClick();
    this.router.navigate(['/user-profile']);
  }

  logout(event?: Event) {
    event?.stopPropagation();
    
    // Clear all user-related data
    localStorage.removeItem('jwt');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    
    // Reset component state
    this.userRole = '';
    this.userEmail = '';
    
    this.router.navigate(['/login']);
  }
}