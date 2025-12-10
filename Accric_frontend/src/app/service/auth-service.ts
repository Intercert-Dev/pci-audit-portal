import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtService, DecodedToken } from './jwt-service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(
      private router: Router,
      private jwtService: JwtService
    ) { }

    // Process JWT token with role validation
    processJwtToken(): boolean {
        
        
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        
        if (tokenFromUrl && this.isValidToken(tokenFromUrl)) {
            this.saveToken(tokenFromUrl);
            this.cleanUrl();
            
            // Log user info after saving token
            this.logUserInfo();
            return true;
        }

        // Check existing token in localStorage
        const existingToken = localStorage.getItem('jwt');
        
        if (existingToken && this.isValidToken(existingToken)) {
            this.logUserInfo();
            return true;
        }

        return false;
    }

    // Enhanced token validation - FIXED VERSION
    private isValidToken(token: string): boolean {
        
        if (!token || token.length < 10) {
            return false;
        }
        
        // Check token structure
        const parts = token.split('.');
        if (parts.length !== 3) {

            return false;
        }

        // Check if token is expired - FIX: Pass the token to isTokenExpired
        if (this.isTokenExpired(token)) {  // ✅ FIXED: Pass the token
           
            return false;
        }

        return true;
    }

    // NEW METHOD: Check if specific token is expired
    private isTokenExpired(token: string): boolean {
        try {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            
            if (!payload.exp) {
                return false;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp < currentTime;
            
            return isExpired;
            
        } catch (error) {
            return true;
        }
    }

    // Log user information for debugging
    private logUserInfo(): void {
      const userInfo = this.jwtService.getUserInfo();
    }

    // Save token to localStorage
    private saveToken(token: string): void {
        localStorage.setItem("jwt", token);
        localStorage.setItem("isLoggedIn", "true");  
        // Verify save
        const saved = localStorage.getItem('jwt');

    }

    // Clean URL after successful login
    private cleanUrl(): void {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
        
    }

    // Check if we're on OAuth callback route
    isOAuthCallback(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        const hasToken = urlParams.has('token');
        return hasToken;
    }

    // Logout
    logout(): void {
        localStorage.removeItem('jwt');
        localStorage.removeItem('isLoggedIn');
        this.router.navigate(['/login']);
    }

    // Check Login status
    isLoggedIn(): boolean {
        const jwt = localStorage.getItem('jwt');
        
        if (!jwt) {
            return false;
        }

        // Use the fixed validation for the stored token
        const isValid = this.isValidToken(jwt);
        
        if (!isValid && jwt) {
            // Token exists but invalid, clear it
            this.logout();
        }
        
        return isValid;
    }

    // Get user role
    getUserRole(): string | null {
        return this.jwtService.getUserRole();
    }

    // Check if user is SUPER_ADMIN
    isSuperAdmin(): boolean {
        return this.jwtService.isSuperAdmin();
    }

    // Check if user is ADMIN
    isAdmin(): boolean {
        return this.jwtService.isAdmin();
    }

    // Get user info
    getUserInfo(): DecodedToken | null {
        return this.jwtService.getUserInfo();
    }

    // Get JWT token
    getToken(): string | null {
        return localStorage.getItem('jwt');
    }

    // Check for authentication errors
    checkForAuthErrors(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('error');
    }
}