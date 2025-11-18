import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor() { }

    login() {
        localStorage.setItem('isLoggedIn', 'true');
    }

    // Logout
    logout() {
        console.log("Clicked authservice Logout");
        
        localStorage.removeItem('jwt');
        localStorage.removeItem('tocken');
        localStorage.removeItem('isLoggedIn');
    }

    // Check Google Login OR Normal Login
    isLoggedIn(): boolean {
        console.log("it is in auth-service");
        
        const jwt = localStorage.getItem('jwt');
        console.log("Print JWT : ",jwt);
        
        const tocken = localStorage.getItem('tocken'); 
        console.log("Print JWT2 : ",tocken);


        return !!jwt || !!tocken;
    }
}
