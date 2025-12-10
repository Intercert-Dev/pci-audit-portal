import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    if (this.authService.isOAuthCallback()) {
      console.log("AuthGuard: Processing OAuth callback");
      const success = this.authService.processJwtToken();
      
      if (success) {
        return true;
      } else {
      }
    }

    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      console.log("AuthGuard: User is authenticated");
      return true;
    } else {
      console.log("AuthGuard: User not authenticated, redirecting to login");
      this.router.navigate(['/login']);
      return false;
    }
  }
}