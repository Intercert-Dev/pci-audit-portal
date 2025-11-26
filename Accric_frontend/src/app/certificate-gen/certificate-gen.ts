import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-certificate-gen',
  imports: [CommonModule,FormsModule],
  templateUrl: './certificate-gen.html',
  styleUrl: './certificate-gen.css',
})
export class CertificateGen {

  certificateData: any = null;

  constructor(private http: HttpClient) { }

  generateCertificate(form: NgForm) {
    const certNo = form.value.certificateNo;

    this.http.get(`http://pci.accric.com/api/auth/generate-certificate-from-template`)
      .subscribe({
        next: (res: any) => {
          console.log("Certificate fetched:", res);
          this.certificateData = res; // show on UI
        },
        error: (err) => {
          console.error("Error fetching certificate:", err);
          alert("Certificate not found!");
        }
      });
  }

}
