import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastService } from '../service/toast-service';

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
  isListExpanded = false;
  userRole: string = '';
  userEmail: string = '';
  windowWidth: number = window.innerWidth;

  constructor(private router: Router, private toast : ToastService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects || event.url;
        const isClientsSubmenuRoute = this.isClientsSubmenuRoute(currentUrl);
        const isListsSubmenuRoute = this.isListsSubmenuRoute(currentUrl);

        // Update Clients menu state
        this.isClientsExpanded = isClientsSubmenuRoute;
        
        // Update Lists menu state
        this.isListExpanded = isListsSubmenuRoute;
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth = window.innerWidth;
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
      return null;
    }
  }

  private decodeJWTAndSetUserInfo(): void {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.userRole = '';
      this.userEmail = '';
      this.toast.warning('No JWT token found in localStorage');
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
      
      
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          this.toast.warning('WARNING: JWT token has EXPIRED!');
          // You might want to handle token expiration here
          // For example, redirect to login or refresh the token
        }
      }
    } else {
      // Fallback to localStorage if JWT decoding fails
      this.userRole = localStorage.getItem('userRole') || '';
      this.userEmail = localStorage.getItem('userEmail') || '';
    }
  }

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

  private isListsSubmenuRoute(url: string): boolean {
    const listsSubmenuRoutes = [
      '/client-list',
      '/audit-list', // Changed from '/client' to '/audit-list'
      '/asv-audit-client-list' // Changed from '/list' to '/asv-audit-client-list'
    ];
    return listsSubmenuRoutes.some(route => url.startsWith(route));
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
    // Close other menu when opening this one
    if (this.isClientsExpanded) {
      this.isListExpanded = false;
    }
  }

  toggleListsMenu(event: Event) {
    event.stopPropagation();
    this.isListExpanded = !this.isListExpanded;
    // Close other menu when opening this one
    if (this.isListExpanded) {
      this.isClientsExpanded = false;
    }
  }

  closeClientsMenu() {
    this.isClientsExpanded = false;
  }

  closeListMenu() {
    this.isListExpanded = false;
  }

  onMainMenuItemClick() {
    this.closeClientsMenu();
    this.closeListMenu();
    this.closeDropdown();
  }

  onSubmenuItemClick() {
    // For Clients submenu items - only close dropdown, keep submenu open
    this.closeDropdown();
    // Don't close the Clients submenu
  }

  onSubmenuItemListClick() {
    // For Lists submenu items - only close dropdown, keep submenu open
    this.closeDropdown();
    // Don't close the Lists submenu
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