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
  loading: boolean = false;
  showCertificateForm: boolean = false;
  certificateData: any = null;

  editFields = {
    certificateNo: false,
    companyName: false,
    street_name: false,
    city_name: false,
    state_name: false,
    county_name: false,
    zip_name: false,
    dateIssue: false,
    dateValid: false,
    assessment_classification: false
  };

  certificateOptions = {
    scopeFontSize: '12px',
    tableFontSize: '12px',
    pageSize: 'A4',
    formatType: 'Softcopy',
    includeLineBreak: false,
    showValidityLine: true,
    type: '',
  };

  fontSizes: string[] = ['10px', '12px', '14px', '16px', '18px'];
  tableFontSizes: string[] = ['10px', '12px', '14px', '16px'];
  pageSizes: string[] = ['A4', 'Letter', 'Legal'];
  certificateTypes: string[] = ['Internal', 'External', 'Third Party'];

  constructor(private http: HttpClient) { }

  generateCertificate(form: NgForm) {
    const certNo = form.value.certificateNo?.trim();

    if (!certNo) {
      alert('Please enter a certificate number!');
      this.showCertificateForm = false;
      this.certificateData = null;
      return;
    }

    const token = localStorage.getItem('jwt');
    if (!token) {
      alert('JWT token not found! Please login first.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const url = `http://pci.accric.com/api/auth/client-by-certificate?certificateNo=${certNo}`;

    this.loading = true;
    this.showCertificateForm = false;
    this.certificateData = null;

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('Certificate fetched:', res);

        const apiData = res.data || res;
        this.certificateData = this.initializeCertificateData();
        this.mapApiDataToCertificate(apiData);
        this.certificateData.certificateNo = certNo;
        this.showCertificateForm = true;
      },
      error: (err) => {
        this.loading = false;
        this.showCertificateForm = false;
        this.certificateData = null;
        console.error('Error fetching certificate:', err);

        if (err.status === 404) {
          alert('Certificate not found! Please check the certificate number.');
        } else if (err.status === 401) {
          alert('Invalid or expired token! Please login again.');
        } else {
          alert('Error fetching certificate! Please try again.');
        }
      },
    });
  }

  private initializeCertificateData() {
    return {
      certificateNo: '',
      companyName: '',
      street_name: '',
      city_name: '',
      state_name: '',
      county_name: '',
      zip_name: '',
      dateIssue: '',
      dateValid: '',
      assessment_classification: '',
      legal_entity_name: '',
      certificate_issue_date: '',
      certificate_expiry_date: '',
      certificate_number_unique_id: ''
    };
  }

  private mapApiDataToCertificate(apiData: any) {
    this.certificateData.legal_entity_name = apiData.legal_entity_name || '';
    this.certificateData.street_name = apiData.street_name || '';
    this.certificateData.city_name = apiData.city_name || '';
    this.certificateData.state_name = apiData.state_name || '';
    this.certificateData.county_name = apiData.county_name || '';
    this.certificateData.zip_name = apiData.zip_name || '';
    this.certificateData.certificate_issue_date = apiData.certificate_issue_date || '';
    this.certificateData.certificate_expiry_date = apiData.certificate_expiry_date || '';
    this.certificateData.certificate_number_unique_id = apiData.certificate_number_unique_id || '';
    this.certificateData.assessment_classification = apiData.assessment_classification || '';
    this.certificateData.companyName = apiData.legal_entity_name || '';
    this.certificateData.dateIssue = this.formatDateForInput(apiData.certificate_issue_date);
    this.certificateData.dateValid = this.formatDateForInput(apiData.certificate_expiry_date);
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  onFieldToggle(fieldName: keyof typeof this.editFields) {
    if (!this.editFields[fieldName]) {
      console.log(`Field ${fieldName} editing disabled`);
    } else {
      console.log(`Field ${fieldName} editing enabled`);
    }
  }

  getFinalCertificateData() {
    const finalData = { ...this.certificateData };
    return finalData;
  }

  downloadPDF() {
    if (!this.certificateData || !this.certificateData.certificate_number_unique_id) {
      alert('No certificate data to download! Please generate a certificate first.');
      return;
    }

    console.log('Downloading PDF with options:', this.certificateOptions);
    console.log('Certificate data:', this.getFinalCertificateData());

    const pdfData = {
      certificateData: this.getFinalCertificateData(),
      options: this.certificateOptions,
      editedFields: this.editFields
    };

    alert(`PDF generation initiated for certificate: ${this.certificateData.certificate_number_unique_id}\n\nOptions:\n- Format: ${this.certificateOptions.formatType}\n- Page Size: ${this.certificateOptions.pageSize}\n- Type: ${this.certificateOptions.type || 'Not specified'}`);
  }

  resetForm() {
    this.certificateData = null;
    this.showCertificateForm = false;

    Object.keys(this.editFields).forEach(key => {
      this.editFields[key as keyof typeof this.editFields] = false;
    });

    this.certificateOptions = {
      scopeFontSize: '12px',
      tableFontSize: '12px',
      pageSize: 'A4',
      formatType: 'Softcopy',
      includeLineBreak: false,
      showValidityLine: true,
      type: '',
    };
  }

  get hasEditedFields(): boolean {
    return Object.values(this.editFields).some(value => value === true);
  }

  get editedFieldCount(): number {
    return Object.values(this.editFields).filter(value => value === true).length;
  }
}