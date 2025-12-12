import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-audit-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.css',
  providers: [DatePipe]
})
export class AuditList implements OnInit {
  // API Configuration - Update with your actual API endpoint
  private apiUrl = 'http://pci.accric.com/api/auth/audit-list';
  
  // Data arrays
  auditList: any[] = [];
  filtered_list: any[] = [];
  
  // Search
  search_text: string = '';
  
  // Edit modal
  editingAudit: any = null;
  originalAudit: any = null;
  
  // QSA list for dropdown
  qsaList: string[] = ['QSA 1', 'QSA 2', 'QSA 3', 'QSA 4'];
  
  // Loading state
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.fetchAuditList();
  }

  // Get JWT token from localStorage
  private getJwtToken(): string | null {
    return  localStorage.getItem('jwt');
  }

  // Create HTTP headers with JWT
  private getHeaders(): HttpHeaders {
    const token = this.getJwtToken();
    let headers = new HttpHeaders({
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
        
        // Handle different response formats
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
        
        console.log('Fetched audit list:', this.auditList);
        console.log('Fetched filtered list:', this.filtered_list);
        
        // If no data, load mock data for demo
        if (this.auditList.length === 0) {
          this.loadMockData();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching audit list:', error);
        
        if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to access this resource.';
        } else if (error.status === 404) {
          this.errorMessage = 'API endpoint not found.';
        } else {
          this.errorMessage = `Failed to load audit list: ${error.message || 'Unknown error'}`;
        }
        
        // Load mock data for development/testing
        this.loadMockData();
      }
    });
  }

  // Mock data for testing
  private loadMockData() {
    this.auditList = [
      {
        id: 1,
        company_name: 'Example Corporation',
        assessment_project_name: 'PCI DSS Compliance Audit 2024',
        assessment_type: 'PCI DSS',
        assessment_category: 'Compliance',
        assessment_year: '2024',
        pci_dss_version_application: '4.0',
        assessment_period_covered: 'January 2024 - December 2024',
        audit_start_date: '2024-01-15',
        audit_end_date: '2024-01-30',
        date_of_report_submission: '2024-02-05',
        audit_status: 'COMPLETED',
        certificate_issue_date: '2024-02-10',
        certificate_expiry_date: '2025-02-09',
        certificate_number_unique_id: 'PCIDSS-2024-001',
        classification: 'Confidential',
        next_audit_due_date: '2025-01-15',
        name_of_qsa: 'QSA 1',
        qsa_license_certificate_number: 'QSA-12345',
        audit_manager_reviewer_name: 'John Smith',
        scope_of_assessment: 'Payment card data environment including all systems, processes, and people involved in payment card processing',
        location_of_scope: 'Primary Data Center, Backup Site, Cloud Environment',
        created_at: '2024-01-10'
      },
      {
        id: 2,
        company_name: 'Tech Solutions Ltd',
        assessment_project_name: 'Vulnerability Assessment Q1 2024',
        assessment_type: 'Vulnerability',
        assessment_category: 'Security',
        assessment_year: '2024',
        pci_dss_version_application: 'N/A',
        assessment_period_covered: 'Q1 2024',
        audit_start_date: '2024-03-01',
        audit_end_date: '2024-03-15',
        date_of_report_submission: '2024-03-20',
        audit_status: 'IN_PROGRESS',
        certificate_issue_date: null,
        certificate_expiry_date: null,
        certificate_number_unique_id: null,
        classification: 'Internal',
        next_audit_due_date: '2024-06-01',
        name_of_qsa: 'QSA 2',
        qsa_license_certificate_number: 'QSA-67890',
        audit_manager_reviewer_name: 'Sarah Johnson',
        scope_of_assessment: 'Web applications and external network infrastructure',
        location_of_scope: 'Corporate Network, Cloud Applications',
        created_at: '2024-02-25'
      },
      {
        id: 3,
        company_name: 'Retail Giant Inc',
        assessment_project_name: 'External Security Audit 2024',
        assessment_type: 'External',
        assessment_category: 'Penetration Testing',
        assessment_year: '2024',
        pci_dss_version_application: '3.2.1',
        assessment_period_covered: 'Annual 2024',
        audit_start_date: '2024-04-01',
        audit_end_date: null,
        date_of_report_submission: null,
        audit_status: 'NOT_STARTED',
        certificate_issue_date: null,
        certificate_expiry_date: null,
        certificate_number_unique_id: null,
        classification: 'Restricted',
        next_audit_due_date: '2025-04-01',
        name_of_qsa: 'QSA 3',
        qsa_license_certificate_number: 'QSA-54321',
        audit_manager_reviewer_name: 'Michael Brown',
        scope_of_assessment: 'External facing systems and applications',
        location_of_scope: 'All public-facing endpoints',
        created_at: '2024-03-20'
      }
    ];
    
    this.filtered_list = [...this.auditList];
    console.log('Loaded mock data:', this.auditList);
  }

  // Filter list based on search text
  filter_list() {
    if (!this.search_text.trim()) {
      this.filtered_list = [...this.auditList];
      return;
    }
    
    const searchTerm = this.search_text.toLowerCase().trim();
    this.filtered_list = this.auditList.filter(audit => {
      return (
        (audit.company_name && audit.company_name.toLowerCase().includes(searchTerm)) ||
        (audit.assessment_project_name && audit.assessment_project_name.toLowerCase().includes(searchTerm)) ||
        (audit.assessment_type && audit.assessment_type.toLowerCase().includes(searchTerm)) ||
        (audit.assessment_category && audit.assessment_category.toLowerCase().includes(searchTerm)) ||
        (audit.audit_status && this.getStatusLabel(audit.audit_status).toLowerCase().includes(searchTerm))
      );
    });
  }

  // Edit audit
  editAudit(audit: any) {
    // Create a deep copy of the audit object to edit
    this.editingAudit = JSON.parse(JSON.stringify(audit));
    this.originalAudit = audit;
    
    // Convert dates to proper format for date inputs
    this.editingAudit.audit_start_date = this.formatDateForInput(this.editingAudit.audit_start_date);
    this.editingAudit.audit_end_date = this.formatDateForInput(this.editingAudit.audit_end_date);
    this.editingAudit.date_of_report_submission = this.formatDateForInput(this.editingAudit.date_of_report_submission);
    this.editingAudit.certificate_issue_date = this.formatDateForInput(this.editingAudit.certificate_issue_date);
    this.editingAudit.certificate_expiry_date = this.formatDateForInput(this.editingAudit.certificate_expiry_date);
    this.editingAudit.next_audit_due_date = this.formatDateForInput(this.editingAudit.next_audit_due_date);
  }

  // Save edited audit
  saveAudit() {
    if (!this.validateAuditForm()) {
      return;
    }

    this.isLoading = true;
    
    // Prepare audit data for saving
    const auditToSave = { ...this.editingAudit };
    
    // Send PUT request to update audit
    const headers = this.getHeaders();
    const updateUrl = `${this.apiUrl}/${this.editingAudit.id}`;
    
    this.http.put(updateUrl, auditToSave, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Update local data
        const index = this.auditList.findIndex(a => a.id === this.originalAudit.id);
        if (index !== -1) {
          this.auditList[index] = { ...auditToSave };
          this.filtered_list = [...this.auditList];
        }
        
        // Show success message
        alert('Audit updated successfully!');
        this.cancelEdit();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating audit:', error);
        alert('Failed to update audit. Please try again.');
      }
    });
  }

  // Validate audit form
  private validateAuditForm(): boolean {
    if (!this.editingAudit.company_name?.trim()) {
      alert('Company Name is required');
      return false;
    }
    
    if (!this.editingAudit.audit_start_date) {
      alert('Audit Start Date is required');
      return false;
    }
    
    if (!this.editingAudit.audit_end_date) {
      alert('Audit End Date is required');
      return false;
    }
    
    // Validate date logic if needed
    const startDate = new Date(this.editingAudit.audit_start_date);
    const endDate = new Date(this.editingAudit.audit_end_date);
    
    if (endDate < startDate) {
      alert('Audit End Date cannot be before Audit Start Date');
      return false;
    }
    
    return true;
  }

  // Cancel edit
  cancelEdit() {
    this.editingAudit = null;
    this.originalAudit = null;
  }

  // Delete audit
  deleteAudit(audit: any) {
    if (confirm(`Are you sure you want to delete the audit "${audit.assessment_project_name}"?`)) {
      this.isLoading = true;
      
      const headers = this.getHeaders();
      const deleteUrl = `${this.apiUrl}/${audit.id}`;
      
      this.http.delete(deleteUrl, { headers }).subscribe({
        next: () => {
          this.isLoading = false;
          
          // Remove from local data
          this.auditList = this.auditList.filter(a => a.id !== audit.id);
          this.filtered_list = this.filtered_list.filter(a => a.id !== audit.id);
          
          alert('Audit deleted successfully!');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting audit:', error);
          alert('Failed to delete audit. Please try again.');
        }
      });
    }
  }

  // Export to Excel
  exportToExcel() {
    try {
      // Prepare data for export
      const exportData = this.filtered_list.map(audit => ({
        'Company Name': audit.company_name || 'N/A',
        'Assessment / Project Name': audit.assessment_project_name || 'N/A',
        'Assessment Type': audit.assessment_type || 'N/A',
        'Assessment Category': audit.assessment_category || 'N/A',
        'Assessment Year': audit.assessment_year || 'N/A',
        'PCI DSS Version': audit.pci_dss_version_application || 'N/A',
        'Assessment Period': audit.assessment_period_covered || 'N/A',
        'Audit Start Date': this.formatDate(audit.audit_start_date),
        'Audit End Date': this.formatDate(audit.audit_end_date),
        'Report Submission Date': this.formatDate(audit.date_of_report_submission),
        'Audit Status': this.getStatusLabel(audit.audit_status),
        'Certificate Issue Date': this.formatDate(audit.certificate_issue_date),
        'Certificate Expiry Date': this.formatDate(audit.certificate_expiry_date),
        'Certificate Number': audit.certificate_number_unique_id || 'N/A',
        'Classification': audit.classification || 'N/A',
        'Next Audit Due Date': this.formatDate(audit.next_audit_due_date),
        'QSA Name': audit.name_of_qsa || 'N/A',
        'QSA License': audit.qsa_license_certificate_number || 'N/A',
        'Manager/Reviewer': audit.audit_manager_reviewer_name || 'N/A',
        'Scope': audit.scope_of_assessment || 'N/A',
        'Location': audit.location_of_scope || 'N/A'
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
      
      console.log('Export successful:', exportData.length, 'records exported');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
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

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return this.datePipe.transform(date, 'shortDate') || 'N/A';
    } catch (error) {
      return dateString;
    }
  }

  // Format date for date input field
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  // Get audit status label
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'REPORT_IN_REVIEW': 'Report In Review',
      'COMPLETED': 'Completed',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started'
    };
    
    return statusMap[status] || status;
  }
}