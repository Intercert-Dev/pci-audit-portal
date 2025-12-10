import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface DateErrors {
  auditStart: string;
  auditEnd: string;
  reportSubmittedDate: string;
  certificateIssueDate: string;
  certificateExpiryDate: string;
  nextAuditDueDate: string;
}

interface Client {
  clientId: string;
  legal_entity_name: string;
  trading_name: string;
}

interface AuditPayload {
  clientId: string;
  assessment_project_name: string;
  assessment_type: string;
  assessment_category: string;
  assessment_year: string;
  pci_dss_version_application: string;
  assessment_period_covered: string;
  audit_start_date: string;
  audit_end_date: string;
  date_of_report_submission: string | null;
  audit_status: string;
  certificate_issue_date: string | null;
  certificate_expiry_date: string | null;
  certificate_number_unique_id: string | null;
  classification: string | null;
  next_audit_due_date: string | null;
  name_of_qsa: string | null;
  qsa_license_certificate_number: string | null;
  audit_manager_reviewer_name: string | null;
  scope_of_assessment: string | null;
  location_of_scope: string | null;
}

@Component({
  selector: 'app-add-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-audit.html',
  styleUrl: './add-audit.css',
})
export class AddAudit implements OnInit {
  @ViewChild('auditForm') auditForm!: NgForm;

  activeTab = 'assessment-summary';
  showErrors = false;
  isLoading = false;

  tabs = [
    'assessment-summary',
    'assessor-info',
    'scope-env'
  ];
  qsaList = [
    'Milan',
    'John Smith',
    'Sarah Johnson',
    'Robert Chen',
    'Emma Wilson'
  ];

  auditData = {
    clientId: '',
    clientName: '',
    
    assessment_project_name: '',
    assessment_type: '',
    assessment_category: '',
    assessment_year: '',
    pci_dss_version_application: '',
    assessment_period_covered: '',
    
    audit_start_date: '',
    audit_end_date: '',
    date_of_report_submission: '',
    audit_status: 'NOT_STARTED',
    
    certificate_issue_date: '',
    certificate_expiry_date: '',
    certificate_number_unique_id: '',
    classification: '',
    next_audit_due_date: '',
    
    name_of_qsa: '',
    qsa_license_certificate_number: '',
    audit_manager_reviewer_name: '',
    
    scope_of_assessment: '',
    location_of_scope: ''
  };

  dateErrors: DateErrors = {
    auditStart: '',
    auditEnd: '',
    reportSubmittedDate: '',
    certificateIssueDate: '',
    certificateExpiryDate: '',
    nextAuditDueDate: ''
  };

  clientSearch: string = '';
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClientId: string | null = null;
  showClientDropdown: boolean = false;
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadClients();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterClients(searchTerm);
    });
  }

  loadClients() {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/client-list';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{data: Client[]}>(url, { headers }).subscribe({
      next: (res) => {
        this.clients = res.data;
        this.filteredClients = [...res.data];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load clients:', err);
        this.isLoading = false;
        alert('Failed to load clients. Please try again.');
      }
    });
  }

  onClientSearch() {
    this.searchSubject.next(this.clientSearch);
  }

  filterClients(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.legal_entity_name.toLowerCase().includes(term) ||
      client.trading_name.toLowerCase().includes(term) ||
      client.clientId.toLowerCase().includes(term)
    );
  }

  selectClient(client: Client) {
    this.selectedClientId = client.clientId;
    this.clientSearch = client.legal_entity_name;
    this.auditData.clientId = client.clientId;
    this.auditData.clientName = client.legal_entity_name;
    this.showClientDropdown = false;
    
    // Update form control
    if (this.auditForm?.controls['clientId']) {
      this.auditForm.controls['clientId'].setValue(client.clientId);
      this.auditForm.controls['clientId'].markAsTouched();
      this.auditForm.controls['clientId'].updateValueAndValidity();
    }
  }

  onClientBlur() {
    setTimeout(() => {
      this.showClientDropdown = false;

      if (!this.selectedClientId && this.clientSearch) {
        const matchedClient = this.clients.find(client =>
          client.legal_entity_name.toLowerCase() === this.clientSearch.toLowerCase()
        );

        if (matchedClient) {
          this.selectClient(matchedClient);
        } else {
          this.clientSearch = '';
          this.auditData.clientId = '';
          this.auditData.clientName = '';
          
          if (this.auditForm?.controls['clientId']) {
            this.auditForm.controls['clientId'].setValue('');
            this.auditForm.controls['clientId'].markAsTouched();
            this.auditForm.controls['clientId'].updateValueAndValidity();
          }
        }
      }
    }, 200);
  }

  validateDates(): boolean {
    this.clearDateErrors();
    let isValid = true;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (this.auditData.audit_start_date) {
      const auditStartDate = new Date(this.auditData.audit_start_date);
      if (auditStartDate < currentDate) {
        this.dateErrors.auditStart = 'Audit Start Date cannot be in the past';
        isValid = false;
      }
    }

    if (this.auditData.audit_end_date) {
      const auditEndDate = new Date(this.auditData.audit_end_date);
      if (this.auditData.audit_start_date && auditEndDate <= new Date(this.auditData.audit_start_date)) {
        this.dateErrors.auditEnd = 'Audit End Date must be after Audit Start Date';
        isValid = false;
      }
    }

    if (this.auditData.date_of_report_submission) {
      const reportDate = new Date(this.auditData.date_of_report_submission);
      if (this.auditData.audit_end_date && reportDate < new Date(this.auditData.audit_end_date)) {
        this.dateErrors.reportSubmittedDate = 'Report Submission Date cannot be before Audit End Date';
        isValid = false;
      }
    }

    if (this.auditData.certificate_issue_date) {
      const certIssueDate = new Date(this.auditData.certificate_issue_date);
      if (this.auditData.audit_end_date && certIssueDate < new Date(this.auditData.audit_end_date)) {
        this.dateErrors.certificateIssueDate = 'Certificate Issue Date cannot be before Audit End Date';
        isValid = false;
      }
    }

    if (this.auditData.certificate_expiry_date) {
      const certExpiryDate = new Date(this.auditData.certificate_expiry_date);
      if (this.auditData.certificate_issue_date && certExpiryDate <= new Date(this.auditData.certificate_issue_date)) {
        this.dateErrors.certificateExpiryDate = 'Certificate Expiry Date must be after Certificate Issue Date';
        isValid = false;
      }
    }

    if (this.auditData.next_audit_due_date) {
      const nextAuditDate = new Date(this.auditData.next_audit_due_date);
      if (this.auditData.certificate_expiry_date && nextAuditDate <= new Date(this.auditData.certificate_expiry_date)) {
        this.dateErrors.nextAuditDueDate = 'Next Audit Due Date should be after Certificate Expiry Date';
        isValid = false;
      }
    }

    return isValid;
  }

  clearDateErrors(): void {
    this.dateErrors = {
      auditStart: '',
      auditEnd: '',
      reportSubmittedDate: '',
      certificateIssueDate: '',
      certificateExpiryDate: '',
      nextAuditDueDate: ''
    };
  }

  validateAllFields(): boolean {
    console.log('🔄 Validating all fields...');
    
    let allValid = true;
    
    // 1. Validate client selection
    if (!this.auditData.clientId || this.auditData.clientId.trim() === '') {
      console.log('❌ Client validation failed');
      allValid = false;
    } else {
      console.log('✅ Client validation passed');
    }
    
    // 2. Validate required dates
    if (!this.auditData.audit_start_date) {
      console.log('❌ Audit start date required');
      allValid = false;
    } else {
      console.log('✅ Audit start date provided');
    }
    
    if (!this.auditData.audit_end_date) {
      console.log('❌ Audit end date required');
      allValid = false;
    } else {
      console.log('✅ Audit end date provided');
    }
    
    // 3. Validate date logic
    const datesValid = this.validateDates();
    if (!datesValid) {
      console.log('❌ Date validation failed');
      allValid = false;
    } else {
      console.log('✅ Date validation passed');
    }
    
    console.log(`🎯 Overall validation: ${allValid ? 'PASSED' : 'FAILED'}`);
    return allValid;
  }

  focusOnFirstError(): void {
    if (!this.auditData.clientId) {
      const clientSearchElement = document.querySelector('[name="clientSearch"]') as HTMLInputElement;
      if (clientSearchElement) {
        clientSearchElement.focus();
        clientSearchElement.style.borderColor = '#dc3545';
      }
      return;
    }

    if (!this.auditData.audit_start_date) {
      const element = document.querySelector('[name="audit_start_date"]') as HTMLInputElement;
      if (element) element.focus();
      return;
    }

    if (!this.auditData.audit_end_date) {
      const element = document.querySelector('[name="audit_end_date"]') as HTMLInputElement;
      if (element) element.focus();
      return;
    }

    const errorEntries = Object.entries(this.dateErrors).find(([key, value]) => value);
    if (errorEntries) {
      const [firstErrorField] = errorEntries;
      const fieldMap: {[key: string]: string} = {
        auditStart: 'audit_start_date',
        auditEnd: 'audit_end_date',
        reportSubmittedDate: 'date_of_report_submission',
        certificateIssueDate: 'certificate_issue_date',
        certificateExpiryDate: 'certificate_expiry_date',
        nextAuditDueDate: 'next_audit_due_date'
      };
      
      const formFieldName = fieldMap[firstErrorField];
      const inputElement = document.querySelector(`[name="${formFieldName}"]`) as HTMLInputElement;
      if (inputElement) inputElement.focus();
    }
  }

  saveAndContinue() {
    console.log('💾 Save and Continue for tab:', this.activeTab);
    
    // Validate based on current tab
    if (this.activeTab === 'assessment-summary') {
      const clientValid = !!this.auditData.clientId && this.auditData.clientId.trim() !== '';
      const startDateValid = !!this.auditData.audit_start_date && this.auditData.audit_start_date.trim() !== '';
      const endDateValid = !!this.auditData.audit_end_date && this.auditData.audit_end_date.trim() !== '';
      const datesValid = this.validateDates();
      
      if (!clientValid || !startDateValid || !endDateValid || !datesValid) {
        this.showErrors = true;
        this.focusOnFirstError();
        
        // Show appropriate error message
        let errorMessage = '';
        if (!clientValid) errorMessage = 'Please select a client.';
        else if (!startDateValid) errorMessage = 'Audit Start Date is required.';
        else if (!endDateValid) errorMessage = 'Audit End Date is required.';
        else errorMessage = 'Please fix the date errors before continuing.';
        
        alert(errorMessage);
        return;
      }
    }
    
    this.showErrors = false;
    const currentIndex = this.tabs.indexOf(this.activeTab);

    if (currentIndex < this.tabs.length - 1) {
      // Move to next tab
      this.activeTab = this.tabs[currentIndex + 1];
    } else {
      // If on last tab, submit the form
      this.onSubmit();
    }
  }

  switchTab(tabName: string) {
    if (tabName !== this.activeTab) {
      const currentIndex = this.tabs.indexOf(this.activeTab);
      const targetIndex = this.tabs.indexOf(tabName);

      // Only validate if moving forward from assessment-summary tab
      if (targetIndex > currentIndex && this.activeTab === 'assessment-summary') {
        const clientValid = !!this.auditData.clientId && this.auditData.clientId.trim() !== '';
        const startDateValid = !!this.auditData.audit_start_date && this.auditData.audit_start_date.trim() !== '';
        const endDateValid = !!this.auditData.audit_end_date && this.auditData.audit_end_date.trim() !== '';
        const datesValid = this.validateDates();
        
        if (!clientValid || !startDateValid || !endDateValid || !datesValid) {
          this.showErrors = true;
          this.focusOnFirstError();
          
          let errorMessage = '';
          if (!clientValid) errorMessage = 'Please select a client before switching tabs.';
          else if (!startDateValid) errorMessage = 'Please enter audit start date before switching tabs.';
          else if (!endDateValid) errorMessage = 'Please enter audit end date before switching tabs.';
          else errorMessage = 'Please fix the date errors before switching tabs.';
          
          alert(errorMessage);
          return;
        }
      }

      this.showErrors = false;
      this.activeTab = tabName;
    }
  }

  goBack() {
    const currentIndex = this.tabs.indexOf(this.activeTab);
    if (currentIndex > 0) {
      this.activeTab = this.tabs[currentIndex - 1];
      this.showErrors = false;
    }
  }

  onSubmit() {
    console.log('✅ Submitting audit...');
    
    // Validate all required fields
    if (!this.validateAllFields()) {
      console.log('❌ Validation failed');
      this.showErrors = true;
      this.focusOnFirstError();
      
      let errorMessage = 'Please fix the following errors:\n\n';
      if (!this.auditData.clientId) errorMessage += '• Select a client\n';
      if (!this.auditData.audit_start_date) errorMessage += '• Enter audit start date\n';
      if (!this.auditData.audit_end_date) errorMessage += '• Enter audit end date\n';
      
      // Add date errors if any
      Object.entries(this.dateErrors).forEach(([key, value]) => {
        if (value) {
          errorMessage += `• ${value}\n`;
        }
      });
      
      alert(errorMessage);
      return;
    }

    console.log('✅ All validations passed, creating audit...');
    this.showErrors = false;
    this.createAudit();
  }

  private formatDateForAPI(dateString: string): string | null {
    if (!dateString || dateString.trim() === '') return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  private buildPayload(): AuditPayload {
    return {
      clientId: this.auditData.clientId,
      
      assessment_project_name: this.auditData.assessment_project_name || '',
      assessment_type: this.auditData.assessment_type || '',
      assessment_category: this.auditData.assessment_category || '',
      assessment_year: this.auditData.assessment_year || '',
      pci_dss_version_application: this.auditData.pci_dss_version_application || '',
      assessment_period_covered: this.auditData.assessment_period_covered || '',
      
      audit_start_date: this.formatDateForAPI(this.auditData.audit_start_date) || '',
      audit_end_date: this.formatDateForAPI(this.auditData.audit_end_date) || '',
      date_of_report_submission: this.formatDateForAPI(this.auditData.date_of_report_submission),
      audit_status: this.auditData.audit_status || 'NOT_STARTED',
      
      certificate_issue_date: this.formatDateForAPI(this.auditData.certificate_issue_date),
      certificate_expiry_date: this.formatDateForAPI(this.auditData.certificate_expiry_date),
      certificate_number_unique_id: this.auditData.certificate_number_unique_id || null,
      classification: this.auditData.classification || null,
      next_audit_due_date: this.formatDateForAPI(this.auditData.next_audit_due_date),
      
      name_of_qsa: this.auditData.name_of_qsa || null,
      qsa_license_certificate_number: this.auditData.qsa_license_certificate_number || null,
      audit_manager_reviewer_name: this.auditData.audit_manager_reviewer_name || null,
      
      scope_of_assessment: this.auditData.scope_of_assessment || null,
      location_of_scope: this.auditData.location_of_scope || null
    };
  }

  private createAudit() {
    console.log('Creating audit...');
    this.isLoading = true;
    
    const url = 'http://pci.accric.com/api/auth/add-audit-to-client';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    const payload = this.buildPayload();
    
    console.log('Payload:', JSON.stringify(payload, null, 2));

    this.http.post(url, payload, { headers }).subscribe({
      next: (response: any) => {
        console.log('Audit created successfully:', response);
        this.isLoading = false;
        
        if (response && response.message) {
          alert(`Success: ${response.message}`);
        } else {
          alert('Audit created successfully!');
        }
        
        this.resetForm();
      },
      error: (error: any) => {
        console.error('❌ Error creating audit:', error);
        this.isLoading = false;
        
        let errorMessage = 'Failed to create audit. ';
        
        if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else if (error.status === 401) {
          errorMessage += 'Unauthorized. Please check your authentication token.';
        } else if (error.status === 400) {
          errorMessage += 'Bad request. Please check the data you entered.';
        } else if (error.status === 404) {
          errorMessage += 'Client not found.';
        } else if (error.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        }
        
        alert(errorMessage);
      }
    });
  }

  private resetForm(): void {
    if (this.auditForm) {
      this.auditForm.resetForm();
    }
    
    this.activeTab = 'assessment-summary';
    this.showErrors = false;
    this.clearDateErrors();
    
    this.auditData = {
      clientId: '',
      clientName: '',
      assessment_project_name: '',
      assessment_type: '',
      assessment_category: '',
      assessment_year: '',
      pci_dss_version_application: '',
      assessment_period_covered: '',
      audit_start_date: '',
      audit_end_date: '',
      date_of_report_submission: '',
      audit_status: 'NOT_STARTED',
      certificate_issue_date: '',
      certificate_expiry_date: '',
      certificate_number_unique_id: '',
      classification: '',
      next_audit_due_date: '',
      name_of_qsa: '',
      qsa_license_certificate_number: '',
      audit_manager_reviewer_name: '',
      scope_of_assessment: '',
      location_of_scope: ''
    };
    
    this.clientSearch = '';
    this.selectedClientId = null;
    this.filteredClients = [...this.clients];
  }
}