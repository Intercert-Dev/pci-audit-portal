import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-certificate-gen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificate-gen.html',
  styleUrls: ['./certificate-gen.css'],
})
export class CertificateGen {

  certificateData: any = null;
  loading: boolean = false; // optional loading indicator

  constructor(private http: HttpClient) { }

  generateCertificate(form: NgForm) {
    const certNo = form.value.certificateNo?.trim();

    if (!certNo) {
      alert("Please enter a certificate number!");
      return;
    }

    const token = localStorage.getItem("jwt");
    if (!token) {
      alert("JWT token not found! Please login first.");
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    const url = `http://pci.accric.com/api/auth/client-by-certificate?certificateNo=${certNo}`;

    this.loading = true;
    this.certificateData = null;

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log("Certificate fetched:", res);
        this.certificateData = res.data || res; // use data object from API
      },
      error: (err) => {
        this.loading = false;
        console.error("Error fetching certificate:", err);
        alert("Certificate not found or invalid token!");
      }
    });
  }
}
