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

  constructor(private authService: AuthService,private router : Router) { }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToProfile(event: Event) {
    event.stopPropagation();
    alert("Go to profile page");
  }

  logout(event?: Event) {
  event?.stopPropagation();

  // Remove JWT token
  localStorage.removeItem("jwt");

  // Redirect to login page
  this.router.navigate(['/login']);
}

}
