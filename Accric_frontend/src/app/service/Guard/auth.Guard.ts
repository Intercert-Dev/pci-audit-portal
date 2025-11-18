import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    console.log("it is in guard ");

    if (this.authService.isLoggedIn()) {
      console.log("Successfully Login : ");
      return true;
    } else {
      console.log("We got any error like");
      this.router.navigate(['/login']); // redirect to login
      return false;
    }
  }
}
