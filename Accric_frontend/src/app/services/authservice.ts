import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,

  ) { }



googleLogin(idToken: string) {
  return this.http.post('/api/auth/google-login', { token: idToken });
}



  // logout(): Observable<any> {
  //   return this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
  // }



}

