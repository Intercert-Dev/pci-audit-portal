import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from '../service/toast-service';



interface Company {
  clientId: string;
  legal_entity_name: string;
}

interface Assessment {
  auditId: string;
  assessment_project_name: string;
  client: {
    clientId: string;
    legal_entity_name?: string;
  };
}




@Component({
  selector: 'app-certificate-gen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificate-gen.html',
  styleUrls: ['./certificate-gen.css'],
})
export class CertificateGen implements OnInit {

  // Search text
  companySearch = '';
  assessmentSearch = '';

  // Dropdown controls
  showCompanyDropdown = false;
  showAssessmentDropdown = false;

  // Lists
  companies: Company[] = [];
  assessments: Assessment[] = [];
  filteredCompanies: Company[] = [];
  filteredAssessments: Assessment[] = [];

  // Selected
  selectedCompanyId: string | null = null;
  selectedAssessmentId: string | null = null;

  // Certificate input binding
  certificateInputValue = '';

  private companySearch$ = new Subject<string>();
  private assessmentSearch$ = new Subject<string>();




  loading: boolean = false;
  showCertificateForm: boolean = false;
  showPdfViewer: boolean = false;
  certificateData: any = null;
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null;
  pdfFileName: string = 'certificate.pdf';
  pdfGenerating: boolean = false;

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
    companyNameFontSize: '20px', // Default: 20px (range: 16px-24px)
    addressFontSize: '12px',     // Default: 12px (range: 8px-16px)
    typeFontSize: '12px',        // Default: 16px (range: 10px-16px)
    pageSize: 'A4',
    formatType: 'Softcopy',
    includeLineBreak: false,
    showValidityLine: true,
    type: '',
  };

  // Font size arrays for dropdowns with specified ranges
  companyNameFontSizes: string[] = ['4px', '8px', '16px', '20px', '24px']; // 16px-38px
  addressFontSizes: string[] = ['8px', '10px', '12px', '14px', '16px']; // 8px-16px
  typeFontSizes: string[] = ['10px', '12px', '14px', '16px']; // 10px-16px
  pageSizes: string[] = ['A4', 'Letter'];
  certificateTypes: string[] = [
    'Internal',
    'External',
    'Third Party',
  ];


  ngOnInit() {
    this.loadCompanies();
    this.loadAssessments();

    this.companySearch$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(v => this.filterCompanies(v));

    this.assessmentSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(v => this.filterAssessments(v));
  }


  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private toast : ToastService
  ) { }

  private enableAllEditFields() {
    Object.keys(this.editFields).forEach(key => {
      this.editFields[key as keyof typeof this.editFields] = true;
    });
  }


  onCompanyBlur() {
    setTimeout(() => {
      this.showCompanyDropdown = false;

      // Auto select if exact match
      if (!this.selectedCompanyId && this.companySearch) {
        const match = this.companies.find(c =>
          c.legal_entity_name.toLowerCase() === this.companySearch.toLowerCase()
        );

        if (match) {
          this.selectCompany(match);
        } else {
          this.companySearch = '';
          this.selectedCompanyId = null;
          this.filteredAssessments = [];
        }
      }

      this.cdr.detectChanges();
    }, 200);
  }

  onAssessmentBlur() {
    setTimeout(() => {
      this.showAssessmentDropdown = false;

      if (!this.selectedAssessmentId && this.assessmentSearch) {
        const match = this.filteredAssessments.find(a =>
          a.assessment_project_name.toLowerCase() === this.assessmentSearch.toLowerCase()
        );

        if (match) {
          this.selectAssessment(match);
        } else {
          this.assessmentSearch = '';
          this.selectedAssessmentId = null;
        }
      }

      this.cdr.detectChanges();
    }, 200);
  }

  onCompanySearch() {
    this.companySearch$.next(this.companySearch);
  }

  onAssessmentSearch() {
    this.assessmentSearch$.next(this.assessmentSearch);
  }

  filterCompanies(term: string) {
    this.filteredCompanies = this.companies.filter(c =>
      c.legal_entity_name.toLowerCase().includes(term.toLowerCase())
    );
  }

  filterAssessments(term: string) {
    this.filteredAssessments = this.assessments.filter(a =>
      a.client?.clientId === this.selectedCompanyId &&
      a.assessment_project_name.toLowerCase().includes(term.toLowerCase())
    );
  }

  loadCompanies() {
    const headers = this.getAuthHeaders();

    this.http.get<{ data: Company[] }>(
      'http://pci.accric.com/api/auth/clients-for-audit',
      { headers }
    ).subscribe(res => {
      this.companies = res.data;
      this.filteredCompanies = [...this.companies];
    });
  }
  loadAssessments() {
    const headers = this.getAuthHeaders();

    this.http.get<{ data: Assessment[] }>(
      'http://pci.accric.com/api/auth/audit-list',
      { headers }
    ).subscribe(res => {
      this.assessments = res.data;
      console.log("Certificate Data ", res.data);


    });
  }

  selectCompany(company: Company) {
    this.companySearch = company.legal_entity_name;
    this.selectedCompanyId = company.clientId;

    this.filteredAssessments = this.assessments.filter(
      a => a.client?.clientId === company.clientId
    );

    this.assessmentSearch = '';
    this.selectedAssessmentId = null;
    this.certificateInputValue = '';
    this.showCompanyDropdown = false;
  }

  selectAssessment(assessment: Assessment) {
    this.assessmentSearch = assessment.assessment_project_name;
    this.selectedAssessmentId = assessment.auditId;
    this.showAssessmentDropdown = false;

    // 🔥 CALL BACKEND TO GET CERTIFICATE NUMBER
    this.fetchCertificateNumber();
  }

  fetchCertificateNumber() {
    const headers = this.getAuthHeaders();

    this.http.get<any>(
      `http://pci.accric.com/api/auth/certificate-by-assessment?assessmentId=${this.selectedAssessmentId}`,
      { headers }
    ).subscribe(res => {
      this.certificateInputValue = res.certificate_number;
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }


  generateCertificate(form: NgForm) {
    const certNo = form.value.certificateNo?.trim();

    if (!certNo) {
      this.toast.warning('Please enter a certificate number!');
      this.showCertificateForm = false;
      this.certificateData = null;
      return;
    }

    const token = localStorage.getItem('jwt');
    if (!token) {
      this.toast.error('JWT token not found! Please login first.');
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

        if (err.status === 404) {
         this.toast.error('Certificate not found! Please check the certificate number.');
        } else if (err.status === 401) {
          this.toast.error('Invalid or expired token! Please login again.');
        } else {
          this.toast.error('Error fetching certificate! Please try again.');
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

  // Prepare data for PDF generation API - UPDATED with font size ranges
  preparePdfData() {
    // Extract font size numbers within specified ranges
    const companyNameSize = this.extractFontSizeNumber(this.certificateOptions.companyNameFontSize);
    const addressSize = this.extractFontSizeNumber(this.certificateOptions.addressFontSize);
    const typeSize = this.extractFontSizeNumber(this.certificateOptions.typeFontSize);

    return {
      companyName: this.certificateData.companyName || this.certificateData.legal_entity_name || '',
      issuanceDate: this.certificateData.dateIssue || this.certificateData.certificate_issue_date || '',
      type: this.certificateOptions.type || 'On The Successful Audit against the Payment Card Industry Data Security',
      version: this.certificateData.version || 'Standard Version 4.0.1',
      address: this.certificateData.full_address || '',
      certificateNumber: this.certificateData.certificateNo || this.certificateData.certificate_number_unique_id || '',
      classification: this.certificateData.assessment_classification || '',
      validTill: this.certificateData.dateValid || this.certificateData.certificate_expiry_date || '',
      // Font sizes with validation to ensure they're within specified ranges
      companyNameSize: this.clampFontSize(companyNameSize, 16, 24),      // 16px-24px range
      addressSize: this.clampFontSize(addressSize, 8, 16),              // 8px-16px range
      typeSize: this.clampFontSize(typeSize, 10, 16),                   // 10px-16px range
      name: this.certificateData.auditor_name || 'Milan John',
      // Add page size and other options
      pageSize: this.certificateOptions.pageSize,
      includeLineBreak: this.certificateOptions.includeLineBreak,
      showValidityLine: this.certificateOptions.showValidityLine,
      formatType: this.certificateOptions.formatType || 'Internal'
    };
  }

  private extractFontSizeNumber(fontSize: string): number {
    if (!fontSize) return 12;
    const match = fontSize.match(/(\d+)px/);
    return match ? parseInt(match[1], 10) : 12;
  }

  // Clamp font size to ensure it's within the specified range
  private clampFontSize(size: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, size));
  }

  generateCertificatePdf() {
    if (!this.certificateData || !this.certificateData.certificate_number_unique_id) {
      this.toast.error('No certificate data to generate! Please add a certificate first.');
      return;
    }

    // Prepare the request data according to backend requirements
    const requestData = this.preparePdfData();

    const token = localStorage.getItem('jwt');
    if (!token) {
      this.toast.error('JWT token not found! Please login first.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    });

    this.pdfGenerating = true;
    this.showPdfViewer = false;

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
        this.pdfGenerating = false;
        const pdfBlob = response.body;
        if (!pdfBlob) {
          this.toast.error('No PDF received from server!');
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

      },
      error: (err) => {
        this.pdfGenerating = false;
        if (err.status === 404) {
          this.toast.error('PDF generation service not found!');
        } else if (err.status === 401) {
          this.toast.error('Invalid or expired token! Please login again.');
        } else if (err.status === 400) {
          this.toast.error('Bad request. Please check the certificate data.');
        } else {
          this.toast.error('Error generating PDF! Please try again.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Add method to regenerate PDF when options change
  onOptionsChange() {
    console.log('Certificate options changed:', this.certificateOptions);

    // If you want to auto-regenerate PDF when options change, uncomment the following:
    // if (this.showPdfViewer && this.pdfBlob) {
    //   this.generateCertificatePdf();
    // }
  }

  downloadCurrentPDF() {
    if (!this.pdfBlob) {
      this.toast.error('No PDF available to download!');
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
      this.toast.error('No PDF available to print!');
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
    this.pdfGenerating = false;

    Object.keys(this.editFields).forEach(key => {
      this.editFields[key as keyof typeof this.editFields] = false;
    });

    // Reset to default font sizes
    this.certificateOptions = {
      companyNameFontSize: '20px',
      addressFontSize: '12px',
      typeFontSize: '16px',
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