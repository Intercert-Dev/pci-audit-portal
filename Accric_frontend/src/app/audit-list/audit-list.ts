import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../service/toast-service';

interface QSA {
  qsa_id: string;
  qsa_name: string;
  qsa_email: string;
  certification_number: string;
  signature: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  clientId: string;
  legal_entity_name: string;
  trading_name: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  city_name: string;
  state_name: string;
  county_name: string;
  street_name: string;
  zip_name: string;
  designation: string;
  information_security_officer: string;
  nature_of_business: string;
  technical_contacts: string;
  type_of_business: string;
  website_domain_url: string;
  client_signoff_authority: string;
  client_status: string;
  created_at: string;
  updated_at: string;
}

interface Audit {
  auditId: string;
  assessment_project_name: string;
  assessment_type: string;
  assessment_category: string;
  assessment_year: string;
  assessment_period_covered: string;
  audit_start_date: string;
  audit_end_date: string;
  audit_status: string;
  pci_dss_version_application: string;
  certificate_issue_date: string | null;
  certificate_expiry_date: string | null;
  certificate_number_unique_id: string | null;
  classification: string | null;
  date_of_report_submission: string | null;
  next_audit_due_date: string | null;
  name_of_qsa: string;
  qsa_license_certificate_number: string;
  audit_manager_reviewer_name: string | null;
  scope_of_assessment: string;
  location_of_scope: string;
  created_at: string;
  updated_at: string;
  client: Client;
}

@Component({
  selector: 'app-audit-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.css',
  providers: [DatePipe]
})
export class AuditList implements OnInit {
  // API Configuration
  private apiUrl = 'https://pci.accric.com/api/auth/audit-list';

  // Data arrays
  auditList: Audit[] = [];
  filtered_list: Audit[] = [];

  // Search
  search_text: string = '';

  // Edit modal
  editingAudit: Audit | null = null;
  originalAudit: Audit | null = null;

  // QSA list for dropdown
  qsaList: QSA[] = [];
  
  // Store QSA name mapping
  qsaNameMap: Map<string, string> = new Map();

  // Loading state
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.fetchAuditList();
    this.fetchQSAList();
  }

  // Get JWT token from localStorage
  private getJwtToken(): string | null {
    return localStorage.getItem('jwt');
  }

  // Convert date to YYYY-MM-DD format (same as Postman)
  private formatDateToYMD(date: string | null | undefined): string | null {
    if (!date || date.trim() === '') return null;

    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return null;
      
      // Format to YYYY-MM-DD (same as Postman)
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }

  // Create HTTP headers with JWT
  private getHeaders(): HttpHeaders {
    const token = this.getJwtToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Fetch audit list from API
  fetchAuditList() {
    this.isLoading = true;
    this.errorMessage = '';

    const headers = this.getHeaders();

    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log("Audit list data ",response);
        

        if (response && Array.isArray(response)) {
          this.auditList = response;
          this.filtered_list = [...response];
        } else if (response && response.data && Array.isArray(response.data)) {
          this.auditList = response.data;
          this.filtered_list = [...response.data];
        } else if (response && response.success && response.data && Array.isArray(response.data)) {
          this.auditList = response.data;
          this.filtered_list = [...response.data];
        } else {
          this.auditList = [];
          this.filtered_list = [];
          console.warn('Unexpected response format:', response);
        }

        this.cdr.detectChanges();

      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to access this resource.';
        } else if (error.status === 404) {
          this.errorMessage = 'API endpoint not found.';
        } else if (error.status === 0) {
          this.errorMessage = 'Network error. Please check your internet connection.';
        } else {
          this.errorMessage = `Failed to load audit list: ${error.statusText || 'Unknown error'}`;
        }
        this.cdr.detectChanges();
      }
    });
  }

  fetchQSAList() {
    const url = 'https://pci.accric.com/api/auth/qsa-list';
    const headers = this.getHeaders();

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        
        if (response?.data && Array.isArray(response.data)) {
          this.qsaList = response.data;
          
          // Create a mapping of QSA ID to QSA Name
          this.qsaNameMap.clear();
          this.qsaList.forEach(qsa => {
            this.qsaNameMap.set(qsa.qsa_id, qsa.qsa_name);
          });
        } else {
          this.qsaList = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.qsaList = [];
      }
    });
  }

  // Filter list based on search text
  filter_list() {
    if (!this.search_text.trim()) {
      this.filtered_list = [...this.auditList];
      return;
    }

    const searchTerm = this.search_text.toLowerCase().trim();
    this.filtered_list = this.auditList.filter(audit => {
      const companyName = (audit.client.legal_entity_name || audit.client.trading_name || '').toLowerCase();
      const projectName = (audit.assessment_project_name || '').toLowerCase();
      const assessmentType = (audit.assessment_type || '').toLowerCase();
      const assessmentCategory = (audit.assessment_category || '').toLowerCase();
      const assessmentYear = (audit.assessment_year || '').toLowerCase();
      const status = this.getStatusLabel(audit.audit_status).toLowerCase();

      return (
        companyName.includes(searchTerm) ||
        projectName.includes(searchTerm) ||
        assessmentType.includes(searchTerm) ||
        assessmentCategory.includes(searchTerm) ||
        assessmentYear.includes(searchTerm) ||
        status.includes(searchTerm)
      );
    });
    this.cdr.detectChanges();
  }

  // Edit audit
  editAudit(audit: Audit) {
    // Create a deep copy of the audit object to edit
    this.editingAudit = JSON.parse(JSON.stringify(audit));
    this.originalAudit = audit;

    // Convert dates to proper format for date inputs (YYYY-MM-DD)
    if (this.editingAudit) {
      this.editingAudit.audit_start_date = this.formatDateForInput(this.editingAudit.audit_start_date);
      this.editingAudit.audit_end_date = this.formatDateForInput(this.editingAudit.audit_end_date);
      this.editingAudit.date_of_report_submission = this.formatDateForInput(this.editingAudit.date_of_report_submission);
      this.editingAudit.certificate_issue_date = this.formatDateForInput(this.editingAudit.certificate_issue_date);
      this.editingAudit.certificate_expiry_date = this.formatDateForInput(this.editingAudit.certificate_expiry_date);
      this.editingAudit.next_audit_due_date = this.formatDateForInput(this.editingAudit.next_audit_due_date);
    }
    this.cdr.detectChanges();
  }

  // Save audit - Updated with correct QSA ID handling
  saveAudit() {
    if (!this.editingAudit || !this.originalAudit) return;

    this.isLoading = true;

    const updateUrl = `https://pci.accric.com/api/auth/update-audit/${this.editingAudit.auditId}`;
    const headers = this.getHeaders();

    // Prepare payload with QSA ID
    const payload = {
      assessment_project_name: this.editingAudit.assessment_project_name || '',
      assessment_type: this.editingAudit.assessment_type || '',
      assessment_category: this.editingAudit.assessment_category || '',
      assessment_year: this.editingAudit.assessment_year || '',
      pci_dss_version_application: this.editingAudit.pci_dss_version_application || '',
      assessment_period_covered: this.editingAudit.assessment_period_covered || '',
      audit_start_date: this.formatDateToYMD(this.editingAudit.audit_start_date),
      audit_end_date: this.formatDateToYMD(this.editingAudit.audit_end_date),
      date_of_report_submission: this.formatDateToYMD(this.editingAudit.date_of_report_submission),
      audit_status: this.editingAudit.audit_status || 'NOT_STARTED',
      certificate_issue_date: this.formatDateToYMD(this.editingAudit.certificate_issue_date),
      certificate_expiry_date: this.formatDateToYMD(this.editingAudit.certificate_expiry_date),
      certificate_number_unique_id: this.editingAudit.certificate_number_unique_id || null,
      classification: this.editingAudit.classification || null,
      next_audit_due_date: this.formatDateToYMD(this.editingAudit.next_audit_due_date),
      
      // Send QSA ID - This is the key change
      name_of_qsa: this.editingAudit.name_of_qsa, // QSA ID, not name
      qsa_license_certificate_number: this.editingAudit.qsa_license_certificate_number || null,
      audit_manager_reviewer_name: this.editingAudit.audit_manager_reviewer_name || null,
      scope_of_assessment: this.editingAudit.scope_of_assessment || null,
      location_of_scope: this.editingAudit.location_of_scope || null
    };

    this.http.put(updateUrl, payload, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Update the local data
        const index = this.auditList.findIndex(
          a => a.auditId === this.editingAudit?.auditId
        );

        if (index !== -1) {
          // Create updated audit object
          const updatedAudit: Audit = {
            ...this.originalAudit!,
            assessment_project_name: payload.assessment_project_name || '',
            assessment_type: payload.assessment_type || '',
            assessment_category: payload.assessment_category || '',
            assessment_year: payload.assessment_year || '',
            pci_dss_version_application: payload.pci_dss_version_application || '',
            assessment_period_covered: payload.assessment_period_covered || '',
            
            // Keep dates as they were (not converting)
            audit_start_date: this.editingAudit!.audit_start_date || '',
            audit_end_date: this.editingAudit!.audit_end_date || '',
            audit_status: payload.audit_status || '',
            
            date_of_report_submission: this.editingAudit!.date_of_report_submission,
            certificate_issue_date: this.editingAudit!.certificate_issue_date,
            certificate_expiry_date: this.editingAudit!.certificate_expiry_date,
            certificate_number_unique_id: payload.certificate_number_unique_id,
            classification: payload.classification,
            next_audit_due_date: this.editingAudit!.next_audit_due_date,
            
            // Keep the QSA ID for the interface
            name_of_qsa: this.editingAudit!.name_of_qsa,
            qsa_license_certificate_number: payload.qsa_license_certificate_number || '',
            audit_manager_reviewer_name: payload.audit_manager_reviewer_name,
            scope_of_assessment: payload.scope_of_assessment || '',
            location_of_scope: payload.location_of_scope || '',
            
            // Update the timestamp
            updated_at: new Date().toISOString()
          };

          this.auditList[index] = updatedAudit;
          this.filtered_list = [...this.auditList];
        }

        this.cancelEdit();
        this.toast.success('Audit updated successfully!');
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating audit:', error);
        console.error('Error details:', error.error);
        if (error.error) {
          console.error('Server error response:', error.error);
          console.error('Payload sent:', payload);
        }
        
        this.toast.error(error.error?.message || 'Failed to update audit. Check console for details.');
      }
    });
  }

  // Helper method to get QSA name from ID for display
  getQSADisplayName(qsaId: string): string {
    if (!qsaId) return 'N/A';
    
    // If it's not a UUID (contains hyphen and 36 chars), it might already be a name
    if (!qsaId.includes('-') || qsaId.length !== 36) {
      return qsaId;
    }
    
    // Try to get name from mapping
    return this.qsaNameMap.get(qsaId) || 'N/A';
  }

  // Helper method to get QSA name from ID (for export)
  private getQSAName(qsaId: string): string | null {
    if (!qsaId) return null;
    
    // If it's already a name (not an ID), return it
    if (!qsaId.includes('-') || qsaId.length !== 36) {
      return qsaId;
    }
    
    // Otherwise, try to get name from mapping
    return this.qsaNameMap.get(qsaId) || null;
  }

  // Cancel edit
  cancelEdit() {
    this.editingAudit = null;
    this.originalAudit = null;
    this.cdr.detectChanges();
  }

  // Delete audit
  deleteAudit(audit: Audit) {
    if (confirm(`Are you sure you want to delete the audit "${audit.assessment_project_name}"?`)) {
      this.isLoading = true;

      const headers = this.getHeaders();
      const deleteUrl = `${this.apiUrl}/${audit.auditId}`;

      this.http.delete(deleteUrl, { headers }).subscribe({
        next: () => {
          this.isLoading = false;

          // Remove from local data
          this.auditList = this.auditList.filter(a => a.auditId !== audit.auditId);
          this.filtered_list = this.filtered_list.filter(a => a.auditId !== audit.auditId);

          this.cdr.detectChanges();
          this.toast.success('Audit deleted successfully!');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting audit:', error);
          this.cdr.detectChanges();
          this.toast.error(`Failed to delete audit: ${error.message || 'Unknown error'}`);
        }
      });
    }
  }

  // Export to Excel
  exportToExcel() {
    try {
      // Prepare data for export
      const exportData = this.filtered_list.map(audit => ({
        'Company Name': audit.client.legal_entity_name || audit.client.trading_name || 'N/A',
        'Contact Person': audit.client.contact_name || 'N/A',
        'Email': audit.client.contact_email || 'N/A',
        'Phone': audit.client.phone || 'N/A',
        'Assessment / Project Name': audit.assessment_project_name || 'N/A',
        'Assessment Type': audit.assessment_type || 'N/A',
        'Assessment Category': audit.assessment_category || 'N/A',
        'Assessment Year': audit.assessment_year || 'N/A',
        'Assessment Period': audit.assessment_period_covered || 'N/A',
        'PCI DSS Version': audit.pci_dss_version_application || 'N/A',
        'Audit Start Date': this.formatDate(audit.audit_start_date),
        'Audit End Date': this.formatDate(audit.audit_end_date),
        'Date of Report Submission': this.formatDate(audit.date_of_report_submission || ''),
        'Audit Status': this.getStatusLabel(audit.audit_status),
        'Certificate Issue Date': this.formatDate(audit.certificate_issue_date || ''),
        'Certificate Expiry Date': this.formatDate(audit.certificate_expiry_date || ''),
        'Certificate Number': audit.certificate_number_unique_id || 'N/A',
        'Classification': audit.classification || 'N/A',
        'Next Audit Due Date': this.formatDate(audit.next_audit_due_date || ''),
        'Name of QSA': this.getQSADisplayName(audit.name_of_qsa),
        'QSA License/Certificate Number': audit.qsa_license_certificate_number || 'N/A',
        'Manager/Reviewer Name': audit.audit_manager_reviewer_name || 'N/A',
        'Scope of Assessment': audit.scope_of_assessment || 'N/A',
        'Location in Scope': audit.location_of_scope || 'N/A',
        'Audit ID': audit.auditId || 'N/A'
      }));

      // Convert to CSV
      const csvContent = this.convertToCSV(exportData);

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `audit-list-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.toast.error('Failed to export data. Please try again.');
    }
  }

  // Convert array to CSV
  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Format date for display - updated to handle null values
  formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') return 'N/A';

    try {
      return this.datePipe.transform(dateString, 'dd/MM/yyyy') || 'N/A';
    } catch {
      return 'N/A';
    }
  }

  // Format date for date input field (YYYY-MM-DD)
  formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date for input:', dateString, error);
      return '';
    }
  }

  // Get audit status label
  getStatusLabel(status: string | null | undefined): string {
    if (!status) return 'Unknown';

    const statusMap: { [key: string]: string } = {
      'REPORT_IN_REVIEW': 'Report In Review',
      'COMPLETED': 'Completed',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started'
    };

    return statusMap[status] || status;
  }
}