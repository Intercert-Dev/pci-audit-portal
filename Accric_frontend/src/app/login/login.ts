import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/authservice';

@Component({
  selector: 'app-login',
  standalone : true,
  imports : [CommonModule,FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  loading = false;
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
     (window as any).google.accounts.id.initialize({
      client_id: '1013646318751-gcqtdrjunfmbbjsku8l8uo2vqclcqe4f.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleResponse(response)
    });
  }

  handleGoogleResponse(response: any) {
    const idToken = response.credential;
    if (idToken) {
      this.loading = true;

      this.auth.googleLogin(idToken).subscribe({
        next: (res) => {
          this.loading = false;
          alert('Login Successful');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Google login failed:', err);
          this.loading = false;
          alert('Login Failed: ' + (err.error?.message || 'Please try again.'));
        }
      });
    }
  }

  handleGoogleLoginClick() {
    (window as any).google.accounts.id.prompt();
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    console.log('Remember Me:', this.rememberMe);
  }
}
