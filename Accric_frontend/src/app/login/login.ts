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
    console.log("Login component initialized");
    
    // Check if we have a token in URL (direct OAuth callback to login page)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log("Found token in URL, processing...");
      this.handleToken(token);
      return;
    }

    // First, check if user is already logged in
    if (this.authService.isLoggedIn()) {
      console.log("User already logged in, redirecting to dashboard");
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
    
    console.log("Token processed, redirecting to dashboard");
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
    console.log("Initiating Google OAuth login...");
    
    // Redirect to Google OAuth
    window.location.href = 'http://pci.accric.com/api/auth/google';
  }
}