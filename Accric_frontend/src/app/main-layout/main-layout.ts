import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../service/auth-service';

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayout {
  
  isSidebarOpen = true;
  dropdownOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // OPEN DROPDOWN ON CLICK
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // CLOSE DROPDOWN WHEN MOUSE LEAVES PROFILE IMAGE + DROPDOWN AREA
  closeDropdown() {
    this.dropdownOpen = false;
  }

  // NAVIGATE TO PROFILE
  goToProfile(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/user-profile']);
  }

  // LOGOUT
  logout(event?: Event) {
    event?.stopPropagation();
    localStorage.removeItem('jwt');
    this.router.navigate(['/login']);
  }
}
