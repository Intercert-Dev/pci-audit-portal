import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface Client {
  id: string;
  clientId: string;
  legal_entity_name: string;
  trading_name?: string;
}

interface Audit {
  auditId: string;
  id: string;
  assessment_project_name: string;
  client: {
    clientId: string;
    legal_entity_name: string;
  };
}

@Component({
  selector: 'app-report-verification',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-verification.html',
  styleUrls: ['./report-verification.css'],
})
export class ReportVerification implements OnInit {
  // PREVIOUS REPORT FILES (now arrays for multiple files)
  previousAocReportFiles: File[] = [];
  previousRocReportFiles: File[] = [];
  previousFinalReportFiles: File[] = [];
  
  // CURRENT REPORT FILES (now arrays for multiple files)
  currentAocReportFiles: File[] = [];
  currentRocReportFiles: File[] = [];
  currentFinalReportFiles: File[] = [];
  
  // Client Search Properties
  legalEntitySearch: string = '';
  filteredClients: Client[] = [];
  showClientDropdown: boolean = false;
  selectedClientId: string | null = null;
  selectedClientName: string = '';
  clients: Client[] = [];
  
  // Audit Search Properties
  auditSearch: string = '';
  filteredAudits: Audit[] = [];
  showAuditDropdown: boolean = false;
  selectedAuditId: string | null = null;
  selectedAuditName: string = '';
  audits: Audit[] = [];
  
  // Loading states
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showErrors: boolean = false;
  
  // Search subjects for debouncing
  private clientSearchSubject = new Subject<string>();
  private auditSearchSubject = new Subject<string>();
  
  // Hidden fields that will be auto-filled
  reportData = {
    associatedOrganization: '',
    associatedApplication: ''
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadClients();
    this.loadAudits();
    
    // Setup debounced search for clients
    this.clientSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterClients(searchTerm);
    });
    
    // Setup debounced search for audits
    this.auditSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterAudits(searchTerm);
    });
  }

  // Load clients from API
  loadClients() {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/client-list';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{data: any[]}>(url, { headers }).subscribe({
      next: (res) => {
        // Transform API response to match Client interface
        this.clients = res.data.map(client => ({
          id: client.clientId || client.id,
          clientId: client.clientId || client.id,
          legal_entity_name: client.legal_entity_name || client.name || '',
          trading_name: client.trading_name
        }));
        
        this.filteredClients = [...this.clients];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load clients:', err);
        this.isLoading = false;
        alert('Failed to load clients. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // Load audits from API
  loadAudits() {
    const url = 'http://pci.accric.com/api/auth/audit-list';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      console.error('No token found for loading audits');
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{data: any[]}>(url, { headers }).subscribe({
      next: (res) => {
        // Transform API response to match Audit interface
        this.audits = res.data.map(audit => ({
          auditId: audit.auditId || audit.id,
          id: audit.auditId || audit.id,
          assessment_project_name: audit.assessment_project_name || audit.name || '',
          client: audit.client || { clientId: '', legal_entity_name: '' }
        }));
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load audits:', err);
      }
    });
  }

  // CLIENT SEARCH METHODS
  onClientSearch() {
    this.clientSearchSubject.next(this.legalEntitySearch);
  }

  filterClients(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredClients = [...this.clients];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.legal_entity_name.toLowerCase().includes(term) ||
        (client.trading_name && client.trading_name.toLowerCase().includes(term)) ||
        (client.clientId && client.clientId.toLowerCase().includes(term))
      );
    }
    this.cdr.detectChanges();
  }

  selectClient(client: Client) {
    this.legalEntitySearch = client.legal_entity_name;
    this.selectedClientId = client.clientId;
    this.selectedClientName = client.legal_entity_name;
    this.showClientDropdown = false;
    
    // Auto-fill associated organization from client
    this.reportData.associatedOrganization = client.legal_entity_name;
    
    // Filter audits for the selected client
    this.filterAuditsByClient(client.clientId);
    
    // Clear audit selection when client changes
    this.auditSearch = '';
    this.selectedAuditId = null;
    this.selectedAuditName = '';
    this.reportData.associatedApplication = '';
    
    this.cdr.detectChanges();
  }

  onClientBlur() {
    setTimeout(() => {
      this.showClientDropdown = false;

      // Auto-select if search matches exactly
      if (!this.selectedClientId && this.legalEntitySearch) {
        const matchedClient = this.clients.find(client =>
          client.legal_entity_name.toLowerCase() === this.legalEntitySearch.toLowerCase() ||
          (client.trading_name && client.trading_name.toLowerCase() === this.legalEntitySearch.toLowerCase())
        );

        if (matchedClient) {
          this.selectClient(matchedClient);
        } else {
          // Clear if no match found
          this.legalEntitySearch = '';
          this.selectedClientId = null;
          this.selectedClientName = '';
          this.reportData.associatedOrganization = '';
        }
      }
      
      this.cdr.detectChanges();
    }, 200);
  }

  // AUDIT SEARCH METHODS
  onAuditSearch() {
    this.auditSearchSubject.next(this.auditSearch);
  }

  filterAudits(searchTerm: string) {
    if (!searchTerm.trim()) {
      // If no search term, show all audits for the selected client
      if (this.selectedClientId) {
        this.filteredAudits = this.audits.filter(audit => 
          audit.client && audit.client.clientId === this.selectedClientId
        );
      } else {
        this.filteredAudits = [];
      }
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredAudits = this.audits.filter(audit => {
        // Only show audits for the selected client
        if (this.selectedClientId && (!audit.client || audit.client.clientId !== this.selectedClientId)) {
          return false;
        }
        
        return audit.assessment_project_name.toLowerCase().includes(term);
      });
    }
    this.cdr.detectChanges();
  }

  filterAuditsByClient(clientId: string) {
    if (!clientId) {
      this.filteredAudits = [];
    } else {
      this.filteredAudits = this.audits.filter(audit => 
        audit.client && audit.client.clientId === clientId
      );
    }
    this.cdr.detectChanges();
  }

  selectAudit(audit: Audit) {
    this.auditSearch = audit.assessment_project_name;
    this.selectedAuditId = audit.auditId;
    this.selectedAuditName = audit.assessment_project_name;
    this.showAuditDropdown = false;
    
    // Auto-fill associated application from audit
    this.reportData.associatedApplication = audit.assessment_project_name;
    
    this.cdr.detectChanges();
  }

  onAuditBlur() {
    setTimeout(() => {
      this.showAuditDropdown = false;

      // Auto-select if search matches exactly
      if (!this.selectedAuditId && this.auditSearch && this.selectedClientId) {
        const matchedAudit = this.filteredAudits.find(audit =>
          audit.assessment_project_name.toLowerCase() === this.auditSearch.toLowerCase()
        );

        if (matchedAudit) {
          this.selectAudit(matchedAudit);
        } else {
          this.auditSearch = '';
          this.selectedAuditId = null;
          this.selectedAuditName = '';
          this.reportData.associatedApplication = '';
        }
      }
      
      this.cdr.detectChanges();
    }, 200);
  }

  // FILE UPLOAD METHODS (Updated for multiple files)
  onUpload(
    type: 'previousAoc' | 'previousRoc' | 'previousFinal' | 'currentAoc' | 'currentRoc' | 'currentFinal'
  ) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.multiple = true; // Enable multiple file selection
    
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      
      if (files && files.length > 0) {
        const maxFiles = 10; // Maximum number of files allowed per field
        const maxSizePerFile = 10 * 1024 * 1024; // 10MB per file
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];
        
        // Validate each file
        for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
          const file = files[i];
          
          // Validate file type
          const isPDF = file.type === 'application/pdf' || 
                       file.name.toLowerCase().endsWith('.pdf');
          
          if (!isPDF) {
            invalidFiles.push(`${file.name} - Only PDF files are allowed`);
            continue;
          }
          
          // Validate file size
          if (file.size > maxSizePerFile) {
            invalidFiles.push(`${file.name} - File size exceeds 10MB limit`);
            continue;
          }
          
          validFiles.push(file);
        }
        
        // Show error messages for invalid files
        if (invalidFiles.length > 0) {
          alert(`The following files were rejected:\n\n${invalidFiles.join('\n')}`);
        }
        
        // Assign valid files to the correct property based on type
        if (validFiles.length > 0) {
          switch (type) {
            case 'previousAoc':
              this.previousAocReportFiles = [...this.previousAocReportFiles, ...validFiles];
              break;
            case 'previousRoc':
              this.previousRocReportFiles = [...this.previousRocReportFiles, ...validFiles];
              break;
            case 'previousFinal':
              this.previousFinalReportFiles = [...this.previousFinalReportFiles, ...validFiles];
              break;
            case 'currentAoc':
              this.currentAocReportFiles = [...this.currentAocReportFiles, ...validFiles];
              break;
            case 'currentRoc':
              this.currentRocReportFiles = [...this.currentRocReportFiles, ...validFiles];
              break;
            case 'currentFinal':
              this.currentFinalReportFiles = [...this.currentFinalReportFiles, ...validFiles];
              break;
          }
          
          console.log(`${type} reports uploaded:`, validFiles.map(f => f.name).join(', '));
          this.cdr.detectChanges();
        }
      }
    };
    
    input.click();
  }

  // Remove file from array
  removeFile(type: 'previousAoc' | 'previousRoc' | 'previousFinal' | 'currentAoc' | 'currentRoc' | 'currentFinal', index: number) {
    switch (type) {
      case 'previousAoc':
        this.previousAocReportFiles.splice(index, 1);
        break;
      case 'previousRoc':
        this.previousRocReportFiles.splice(index, 1);
        break;
      case 'previousFinal':
        this.previousFinalReportFiles.splice(index, 1);
        break;
      case 'currentAoc':
        this.currentAocReportFiles.splice(index, 1);
        break;
      case 'currentRoc':
        this.currentRocReportFiles.splice(index, 1);
        break;
      case 'currentFinal':
        this.currentFinalReportFiles.splice(index, 1);
        break;
    }
    this.cdr.detectChanges();
  }

  // FORM SUBMISSION
  onSubmit(form: NgForm) {
    this.showErrors = true;
    
    // Validate client selection
    if (!this.selectedClientId) {
      alert('Please select a company from the dropdown');
      return;
    }
    
    // Validate audit selection
    if (!this.selectedAuditId) { 
      alert('Please select an audit from the dropdown');
      return;
    }
    
    // Validate at least one file is uploaded
    const totalFiles = 
      this.previousAocReportFiles.length +
      this.previousRocReportFiles.length +
      this.previousFinalReportFiles.length +
      this.currentAocReportFiles.length +
      this.currentRocReportFiles.length +
      this.currentFinalReportFiles.length;
    
    if (totalFiles === 0) {
      alert('Please upload at least one report file');
      return;
    }
    
    this.submitReportVerification(form);
  }

  submitReportVerification(form: NgForm) {
    this.isSubmitting = true;
    
    const url = 'http://pci.accric.com/api/auth/create-report-verification';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isSubmitting = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Prepare FormData for submission
    const formData = new FormData();
    
    // Add required fields
    formData.append('client', this.selectedClientId!);
    formData.append('audit', this.selectedAuditId!);
    formData.append('associated_organization', this.reportData.associatedOrganization);
    formData.append('associated_application', this.reportData.associatedApplication);
    
    // Add PREVIOUS report files with EXACT field names from your image
    // Multiple files can be appended with the same field name
    this.previousAocReportFiles.forEach((file) => {
      formData.append('prev_aoc_report', file, file.name);
    });
    
    this.previousRocReportFiles.forEach((file) => {
      formData.append('prev_roc_report', file, file.name);
    });
    
    this.previousFinalReportFiles.forEach((file) => {
      formData.append('prev_final_report', file, file.name);
    });
    
    // Add CURRENT report files with EXACT field names from your image
    this.currentAocReportFiles.forEach((file) => {
      formData.append('current_aoc_report', file, file.name);
    });
    
    this.currentRocReportFiles.forEach((file) => {
      formData.append('current_roc_report', file, file.name);
    });
    
    this.currentFinalReportFiles.forEach((file) => {
      formData.append('current_final_report', file, file.name);
    });
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.post(url, formData, { headers }).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        
        if (response && response.message) {
          alert(`Success: ${response.message}`);
        } else if (response && response.success) {
          alert('Report verification submitted successfully!');
        } else {
          alert('Report verification submitted successfully!');
        }
        
        this.resetForm(form);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error submitting report verification:', error);
        this.isSubmitting = false;
        
        let errorMessage = 'Failed to submit report verification. ';
        
        if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else if (error.error && error.error.errors) {
          // Handle validation errors from backend
          const errors = error.error.errors;
          errorMessage += Object.values(errors).flat().join(', ');
        } else if (error.status === 401) {
          errorMessage += 'Unauthorized. Please check your authentication token.';
        } else if (error.status === 400) {
          errorMessage += 'Bad request. Please check the data you entered.';
        } else if (error.status === 413) {
          errorMessage += 'File size too large. Please reduce file sizes.';
        } else if (error.status === 404) {
          errorMessage += 'API endpoint not found.';
        } else if (error.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        }
        
        alert(errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(form: NgForm) {
    form.resetForm();
    this.legalEntitySearch = '';
    this.auditSearch = '';
    this.selectedClientId = null;
    this.selectedClientName = '';
    this.selectedAuditId = null;
    this.selectedAuditName = '';
    
    // Reset all file arrays
    this.previousAocReportFiles = [];
    this.previousRocReportFiles = [];
    this.previousFinalReportFiles = [];
    this.currentAocReportFiles = [];
    this.currentRocReportFiles = [];
    this.currentFinalReportFiles = [];
    
    this.filteredClients = [...this.clients];
    this.filteredAudits = [];
    this.reportData = {
      associatedOrganization: '',
      associatedApplication: ''
    };
    this.showErrors = false;
    this.cdr.detectChanges();
  }

  // Helper method to get selected client name
  getSelectedClientName(): string {
    if (!this.selectedClientId) return '';
    const client = this.clients.find(c => c.clientId === this.selectedClientId);
    return client ? client.legal_entity_name : '';
  }
}