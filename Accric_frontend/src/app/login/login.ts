import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  loading = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    
    // Check if we have a token in URL (direct OAuth callback to login page)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      this.handleToken(token);
      return;
    }

    // First, check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Check for authentication errors
    this.checkAuthenticationErrors();
  }

  private handleToken(token: string) {
    this.loading = true;
    
    // Save the token directly
    localStorage.setItem("jwt", token);
    localStorage.setItem("isLoggedIn", "true");
    
    // Clean URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    this.router.navigate(['/dashboard']);
  }

  private checkAuthenticationErrors() {
    // Check URL parameters for errors
    const error = this.authService.checkForAuthErrors();
    if (error) {
      this.handleLoginError(error);
    }

    // Also subscribe to route changes
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.handleLoginError(params['error']);
      }
    });
  }

  private handleLoginError(error: string) {
    switch (error) {
      case 'unauthorized_email':
        this.errorMessage = 'Please use your company email address (@intercert.com) to login.';
        break;
      case 'user_not_registered':
        this.errorMessage = 'User not registered. Please contact administrator.';
        break;
      case 'login_failed':
        this.errorMessage = 'Login failed. Please try again.';
        break;
      default:
        this.errorMessage = 'An error occurred during login.';
    }
    this.loading = false;
  }

  loginWithGoogle() {
    this.loading = true;
    this.errorMessage = '';

    
    // Redirect to Google OAuth
    window.location.href = 'https://pci.accric.com/api/auth/google';
  }
}