import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }


  ngOnInit() {
    // Move JWT from cookie → localStorage
    this.authService.saveJwtFromCookie();

    // If JWT exists in localStorage → redirect
    if (localStorage.getItem("jwt")) {
      this.router.navigate(['/dashboard']);
    }
  }


  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  onLogin() {
    this.authService.login();
    this.router.navigate(['/dashboard']);
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    console.log('Remember Me:', this.rememberMe);
  }
  loginWithGoogle() {
    window.location.href = 'https://unsordid-kenya-semirarely.ngrok-free.dev/api/auth/google';
  }
}
