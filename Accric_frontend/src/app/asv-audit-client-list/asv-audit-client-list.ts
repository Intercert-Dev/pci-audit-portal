import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-asv-audit-client-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './asv-audit-client-list.html',
  styleUrl: './asv-audit-client-list.css',
  providers: [DatePipe]
})
export class AsvAuditClientList implements OnInit {
  // API Configuration
  private apiUrl = 'http://pci.accric.com/api/auth/asv-list';
  
  // Data arrays
  auditList: any[] = [];
  filtered_list: any[] = [];
  
  // Search
  search_text: string = '';
  
  // Edit modal
  editingAudit: any = null;
  originalAudit: any = null;
  
  // IP Details modal
  viewingIpDetails: boolean = false;
  selectedAudit: any = null;
  ipList: string[] = [];
  
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
      return (
        (audit.company_name && audit.company_name.toLowerCase().includes(searchTerm)) ||
        (audit.project_name && audit.project_name.toLowerCase().includes(searchTerm)) ||
        (audit.associated_organization && audit.associated_organization.toLowerCase().includes(searchTerm)) ||
        (audit.associated_application && audit.associated_application.toLowerCase().includes(searchTerm)) ||
        (audit.auditor_name && audit.auditor_name.toLowerCase().includes(searchTerm)) ||
        (audit.audit_type && audit.audit_type.toLowerCase().includes(searchTerm)) ||
        (audit.status && audit.status.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Edit audit
  editAudit(audit: any) {
    // Create a deep copy of the audit object to edit
    this.editingAudit = JSON.parse(JSON.stringify(audit));
    this.originalAudit = audit;
    
    // Convert dates to proper format for date inputs
    if (this.editingAudit.start_date) {
      this.editingAudit.start_date = this.formatDateForInput(this.editingAudit.start_date);
    }
    if (this.editingAudit.end_date) {
      this.editingAudit.end_date = this.formatDateForInput(this.editingAudit.end_date);
    }
  }

  // Save edited audit
  saveAudit() {
    if (!this.validateAuditForm()) {
      return;
    }

    this.isLoading = true;
    
    // Convert dates back to proper format
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
    
    if (!this.editingAudit.project_name?.trim()) {
      alert('Project Name is required');
      return false;
    }
    
    if (this.editingAudit.number_ip === null || this.editingAudit.number_ip === undefined || this.editingAudit.number_ip < 0) {
      alert('Number of IP must be a non-negative number');
      return false;
    }
    
    if (!this.editingAudit.ip_details?.trim()) {
      alert('IP Details are required');
      return false;
    }
    
    if (!this.editingAudit.status?.trim()) {
      alert('Audit Status is required');
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
    if (confirm(`Are you sure you want to delete the audit "${audit.project_name}"?`)) {
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

  // View IP details
  viewAuditDetails(audit: any) {
    this.selectedAudit = audit;
    this.viewingIpDetails = true;
    
    // Parse IP details string into array
    if (audit.ip_details) {
      // Split by commas, newlines, or spaces and clean up
      this.ipList = audit.ip_details
        .split(/[, \n]+/)
        .map((ip: string) => ip.trim())
        .filter((ip: string) => ip.length > 0);
    } else {
      this.ipList = [];
    }
  }

  // Close IP details modal
  closeIpDetails() {
    this.viewingIpDetails = false;
    this.selectedAudit = null;
    this.ipList = [];
  }

  // Export to Excel
  exportToExcel() {
    try {
      // Prepare data for export
      const exportData = this.filtered_list.map(audit => ({
        'Company Name': audit.company_name || 'N/A',
        'Project Name': audit.project_name || 'N/A',
        'Number of IP': audit.number_ip || 0,
        'Associated Organization': audit.associated_organization || 'N/A',
        'Associated Application': audit.associated_application || 'N/A',
        'IP Details': audit.ip_details || 'N/A',
        'Status': audit.status || 'N/A',
        'Created Date': audit.created_at ? this.formatDate(audit.created_at) : 'N/A',
        'Start Date': audit.start_date ? this.formatDate(audit.start_date) : 'N/A',
        'End Date': audit.end_date ? this.formatDate(audit.end_date) : 'N/A',
        'Auditor Name': audit.auditor_name || 'N/A',
        'Audit Type': this.getAuditTypeLabel(audit.audit_type) || 'N/A'
      }));

      // Convert to CSV
      const csvContent = this.convertToCSV(exportData);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `asv-audit-list-${new Date().toISOString().split('T')[0]}.csv`);
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

  // Get audit type label
  getAuditTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'PCI_ASV': 'PCI ASV',
      'INTERNAL': 'Internal',
      'EXTERNAL': 'External',
      'VULNERABILITY': 'Vulnerability'
    };
    
    return typeMap[type] || type;
  }

  // Get status label
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed'
    };
    
    return statusMap[status] || status;
  }
}