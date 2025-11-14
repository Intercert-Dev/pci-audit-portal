import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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


  ngOnInit() {
    
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
