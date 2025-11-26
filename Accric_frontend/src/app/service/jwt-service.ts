import { Injectable } from '@angular/core';

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  // Decode JWT token without verification (for frontend use)
  decodeToken(token: string): DecodedToken | null {
    try {
      if (!token) {
        return null;
      }

      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  // Get user role from token
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    return decoded?.role || null;
  }

  // Get user ID from token
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    return decoded?.userId || null;
  }

  // Get user email from token
  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    return decoded?.email || null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user is SUPER_ADMIN
  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  // Check if user is ADMIN
  isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.isSuperAdmin();
  }

  // Check if token is expired
 // Add this method to your JwtService for token expiration check with parameter
isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;

    const decoded = this.decodeToken(tokenToCheck);
    if (!decoded?.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
}

  // Get token from localStorage
  private getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  // Get all user info
  getUserInfo(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    return this.decodeToken(token);
  }
}