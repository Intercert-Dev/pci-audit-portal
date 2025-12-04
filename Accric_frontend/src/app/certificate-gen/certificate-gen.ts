import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  showPdfViewer: boolean = false;
  certificateData: any = null;
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null;
  pdfFileName: string = 'certificate.pdf';

  @ViewChild('pdfViewer') pdfViewer!: ElementRef;

  editFields = {
    certificateNo: false,
    companyName: false,
    full_address: false,
    dateIssue: false,
    dateValid: false,
    assessment_classification: false,
    version: false,
    auditor_name: false 
  };

  auditorList = ['Milan John'];

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

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  private enableAllEditFields() {
    Object.keys(this.editFields).forEach(key => {
      this.editFields[key as keyof typeof this.editFields] = true;
    });
  }

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
    this.showPdfViewer = false;

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('Certificate fetched:', res);

        const apiData = res.data || res;
        this.certificateData = this.initializeCertificateData();
        this.mapApiDataToCertificate(apiData);

        this.certificateData.certificateNo = certNo;
        this.setFullAddress();
        this.enableAllEditFields();
        this.showCertificateForm = true;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
    });
  }

  private initializeCertificateData() {
    return {
      certificateNo: '',
      companyName: '',
      full_address: '',
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
      certificate_number_unique_id: '',
      version: '',
      auditor_name: ''
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
    this.certificateData.version = apiData.version || 'Standard Version 4.0.1';
    this.certificateData.auditor_name = apiData.auditor_name || 'Milan John';
  }

  private setFullAddress() {
    const d = this.certificateData;
    this.certificateData.full_address =
      `${d.street_name || ''}, ${d.city_name || ''}, ${d.state_name || ''}, ${d.county_name || ''}, ${d.zip_name || ''}`
        .replace(/,\s*,/g, ',')
        .replace(/^,|,$/g, '')
        .trim();
  }

  splitAddress() {
    if (!this.certificateData.full_address) return;

    const parts = this.certificateData.full_address.split(',');

    this.certificateData.street_name = parts[0]?.trim() || '';
    this.certificateData.city_name = parts[1]?.trim() || '';
    this.certificateData.state_name = parts[2]?.trim() || '';
    this.certificateData.county_name = parts[3]?.trim() || '';
    this.certificateData.zip_name = parts[4]?.trim() || '';
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

  // Prepare data for PDF generation API
  preparePdfData() {
    return {
      companyName: this.certificateData.companyName || this.certificateData.legal_entity_name || '',
      issuanceDate: this.certificateData.dateIssue || this.certificateData.certificate_issue_date || '',
      type: this.certificateOptions.type || 'On The Successful Audit against the Payment Card Industry Data Security',
      version: this.certificateData.version || 'Standard Version 4.0.1',
      address: this.certificateData.full_address || '',
      certificateNumber: this.certificateData.certificateNo || this.certificateData.certificate_number_unique_id || '',
      classification: this.certificateData.assessment_classification || '',
      validTill: this.certificateData.dateValid || this.certificateData.certificate_expiry_date || '',
      companyNameSize: 20,
      addressSize: 12,
      typeSize: 16,
      name:'Milan John'
    };
  }

  private extractFontSizeNumber(fontSize: string): number {
    if (!fontSize) return 12;
    const match = fontSize.match(/(\d+)px/);
    return match ? parseInt(match[1], 10) : 12;
  }

  generateCertificatePdf() {
    if (!this.certificateData || !this.certificateData.certificate_number_unique_id) {
      alert('No certificate data to download! Please generate a certificate first.');
      return;
    }

    console.log('Downloading PDF with options:', this.certificateOptions);

    // Prepare the request data according to backend requirements
    const requestData = this.preparePdfData();
    console.log('PDF Request Data:', requestData);

    const token = localStorage.getItem('jwt');
    if (!token) {
      alert('JWT token not found! Please login first.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
      'Content-Type': 'application/json'
    });

    this.http.post(
      'http://pci.accric.com/api/auth/generate-certificate-from-template',
      requestData,
      { 
        headers: headers,
        responseType: 'blob',
        observe: 'response'
      }
    ).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const pdfBlob = response.body;
        if (!pdfBlob) {
          alert('No PDF received from server!');
          return;
        }

        this.pdfBlob = pdfBlob;
        const pdfUrl = URL.createObjectURL(pdfBlob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);

        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (fileNameMatch && fileNameMatch[1]) {
            this.pdfFileName = fileNameMatch[1];
          } else {
            // Generate filename based on certificate number
            this.pdfFileName = `certificate-${this.certificateData.certificateNo || this.certificateData.certificate_number_unique_id}.pdf`;
          }
        } else {
          this.pdfFileName = `certificate-${this.certificateData.certificateNo || this.certificateData.certificate_number_unique_id}.pdf`;
        }

        this.showPdfViewer = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          if (this.pdfViewer) {
            this.pdfViewer.nativeElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);

        console.log('PDF loaded successfully');
      },
      error: (err) => {
        console.error('Error generating PDF:', err);
        if (err.status === 404) {
          alert('PDF generation service not found!');
        } else if (err.status === 401) {
          alert('Invalid or expired token! Please login again.');
        } else if (err.status === 400) {
          alert('Bad request. Please check the certificate data.');
        } else {
          alert('Error generating PDF! Please try again.');
        }
      }
    });
  }

  downloadCurrentPDF() {
    if (!this.pdfBlob) {
      alert('No PDF available to download!');
      return;
    }

    const downloadUrl = URL.createObjectURL(this.pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = this.pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
  }

  closePdfViewer() {
    this.showPdfViewer = false;
    
    // Clean up object URL if it exists
    if (this.pdfUrl) {
      // Get the actual string URL from SafeResourceUrl
      const url = (this.pdfUrl as any).changingThisBreaksApplicationSecurity || '';
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
    
    this.pdfUrl = null;
    this.cdr.detectChanges();
  }

  printPDF() {
    if (!this.pdfBlob) {
      alert('No PDF available to print!');
      return;
    }

    const pdfUrl = URL.createObjectURL(this.pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  }

  resetForm() {
    this.certificateData = null;
    this.showCertificateForm = false;
    this.showPdfViewer = false;
    
    // Clean up object URL if it exists
    if (this.pdfUrl) {
      // Get the actual string URL from SafeResourceUrl
      const url = (this.pdfUrl as any).changingThisBreaksApplicationSecurity || '';
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
    
    this.pdfUrl = null;
    this.pdfBlob = null;

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

    this.cdr.detectChanges();
  }

  get hasEditedFields(): boolean {
    return Object.values(this.editFields).some(value => value === true);
  }

  get editedFieldCount(): number {
    return Object.values(this.editFields).filter(value => value === true).length;
  }
}