import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor() { }

    // Read cookie by name
    private getCookie(name: string): string | null {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    saveJwtFromCookie() {
    const jwt = this.getCookie("jwt");

    console.log("JWT found in cookie:", jwt);

    if (jwt) {
        localStorage.setItem("jwt", jwt);
        localStorage.setItem("isLoggedIn", "true");
    } else {
        console.log("No JWT found in cookies!");
    }
}


    // Logout
    logout() {
        console.log("Clicked authservice Logout");
        
        localStorage.removeItem('jwt');
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
    }

    // Check Login (Google or Normal)
    isLoggedIn(): boolean {
        console.log("Checking isLoggedIn...");

        const jwt = localStorage.getItem('jwt');
        return !!jwt;
    }

    login(){

    }
}
