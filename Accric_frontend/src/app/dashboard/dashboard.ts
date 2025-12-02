import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {

  loginData: any = null;  // store API response
  totalClients: number = 0;
  activeClients: number = 0;
  suspendedClients: number = 0;
  totalCertificates: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {

    // Step 1: get JWT token from URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        console.log("JWT Token Received:", token);

        // Step 2: Save token in localStorage
        localStorage.setItem('jwt', token);

        // Step 3: Remove token from URL
        this.router.navigate([], {
          relativeTo: this.route,
          replaceUrl: true,
          queryParams: {}
        });

        // Step 4: Call login-response API
        this.fetchLoginDetails(token);
      } else {
        // If no new token → use saved token
        const savedToken = localStorage.getItem('jwt');
        if (savedToken) {
          this.fetchLoginDetails(savedToken);
        }
      }
    });
  }


  fetchLoginDetails(token: string) {
    const url = "http://pci.accric.com/api/auth/login-response";

    const headers = new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {
        console.log("Login Response API Data:", res);

        // Store full response
        this.loginData = res;

        // Assign dynamic values
        this.totalClients = res.totalClients;
        this.activeClients = res.activeClientsCount;
        this.suspendedClients = res.suspendedClientsCount;
        this.totalCertificates = res.clientsWithCertificateCount;

      },
      error: (err) => {
        console.error("Login Response API Failed:", err);
      }
    });
  }



  cards = [
    { id: 1, count: 507, title: 'User', link: 'Related Link' },
    { id: 2, count: 178, title: 'Certification Form', link: 'Related Link' },
    { id: 3, count: 235, title: 'Auditor', link: 'Related Link' },
    { id: 4, count: 856, title: 'Client', link: 'Related Link' }
  ];
}
