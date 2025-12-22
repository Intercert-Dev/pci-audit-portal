import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../service/toast-service';
import * as XLSX from 'xlsx';

interface AsvAuditResponse {
  asv_id: string;
  associated_application: string;
  associated_organization: string;
  audit: {
    assessment_project_name: string;
    auditId: string;
    [key: string]: any;
  };
  client: {
    legal_entity_name: string;
    trading_name: string;
    clientId: string;
    [key: string]: any;
  };
  created_at: string;
  ip_details: Array<{ ip: string }>;
  number_of_ip: number;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  status: string;
  updated_at: string;
}

interface AsvAuditDisplay {
  id: string;
  asv_id: string;
  company_name: string;
  project_name: string;
  number_ip: number;
  associated_organization: string;
  associated_application: string;
  ip_details: string;
  ip_details_array: string[];
  status: string;
  created_at: string;
  updated_at: string;
  raw_audit?: AsvAuditResponse;
}

@Component({
  selector: 'app-asv-audit-client-list',
  templateUrl: './asv-audit-client-list.html',
  styleUrls: ['./asv-audit-client-list.css'],
  imports: [CommonModule, FormsModule]
})
export class AsvAuditClientList implements OnInit {
  all_audits: AsvAuditDisplay[] = [];
  filtered_list: AsvAuditDisplay[] = [];
  search_text: string = '';
  
  // Edit Modal
  editingAudit: AsvAuditDisplay | null = null;
  editAuditBackup: AsvAuditDisplay | null = null;
  
  // IP Details Modal
  viewingIpDetails: boolean = false;
  selectedAudit: AsvAuditDisplay | null = null;
  ipList: string[] = [];
  
  isLoading: boolean = false;
  
  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAsvAudits();
  }

  // Load ASV Audits from API
  loadAsvAudits(): void {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/asv-list';
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.get<{ data: AsvAuditResponse[] }>(url, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.all_audits = response.data.map(audit => this.mapAuditToDisplay(audit));
        this.filtered_list = [...this.all_audits];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading ASV audits:', error);
        this.toast.error('Failed to load ASV audits. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
  
  // Map API response to display format
  private mapAuditToDisplay(audit: AsvAuditResponse): AsvAuditDisplay {
    const ipStrings = audit.ip_details.map(item => item.ip);
    
    return {
      id: audit.asv_id,
      asv_id: audit.asv_id,
      company_name: audit.client?.legal_entity_name || audit.client?.trading_name || 'N/A',
      project_name: audit.audit?.assessment_project_name || 'N/A',
      number_ip: audit.number_of_ip || 0,
      associated_organization: audit.associated_organization || 'N/A',
      associated_application: audit.associated_application || 'N/A',
      ip_details: ipStrings.join(', '),
      ip_details_array: ipStrings,
      status: audit.status || 'PENDING',
      created_at: audit.created_at,
      updated_at: audit.updated_at,
      raw_audit: audit
    };
  }
  
  // Filter list based on search text
  filter_list(): void {
    if (!this.search_text.trim()) {
      this.filtered_list = [...this.all_audits];
    } else {
      const searchTerm = this.search_text.toLowerCase().trim();
      this.filtered_list = this.all_audits.filter(audit => 
        audit.company_name.toLowerCase().includes(searchTerm) ||
        audit.project_name.toLowerCase().includes(searchTerm) ||
        audit.associated_organization.toLowerCase().includes(searchTerm) ||
        audit.associated_application.toLowerCase().includes(searchTerm) ||
        audit.ip_details.toLowerCase().includes(searchTerm) ||
        audit.status.toLowerCase().includes(searchTerm)
      );
    }
    this.cdr.detectChanges();
  }
  
  // Get status label for display
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'INPROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'REVIEW': 'Report In Review',
      'NOTSTARTED':'Not Started'
    };
    return statusMap[status] || status;
  }
  
  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }
  
  // View audit details
  viewAuditDetails(audit: AsvAuditDisplay): void {
    this.selectedAudit = audit;
    this.ipList = audit.ip_details_array || [];
    this.viewingIpDetails = true;
    this.cdr.detectChanges();
  }
  
  // Close IP details modal
  closeIpDetails(): void {
    this.viewingIpDetails = false;
    this.selectedAudit = null;
    this.ipList = [];
    this.cdr.detectChanges();
  }
  
  // Edit audit
  editAudit(audit: AsvAuditDisplay): void {
    // Create a deep copy for editing
    this.editingAudit = {
      ...audit,
      ip_details_array: [...audit.ip_details_array]
    };
    this.editAuditBackup = { ...audit };
    this.cdr.detectChanges();
  }
  
  // Cancel edit
  cancelEdit(): void {
    if (this.editAuditBackup) {
      const index = this.all_audits.findIndex(a => a.id === this.editAuditBackup!.id);
      if (index !== -1) {
        this.all_audits[index] = this.editAuditBackup;
      }
    }
    this.editingAudit = null;
    this.editAuditBackup = null;
    this.filtered_list = [...this.all_audits];
    this.cdr.detectChanges();
  }
  
  // Save edited audit
  saveAudit(): void {
    if (!this.editingAudit) return;
    
    // Validation
    if (!this.editingAudit.company_name || !this.editingAudit.project_name || 
        !this.editingAudit.ip_details || this.editingAudit.number_ip < 0) {
      this.toast.error('Please fill all required fields correctly.');
      return;
    }
    
    // Convert IP details string to array
    const ipArray = this.editingAudit.ip_details
      .split(/[\s,]+/)
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
    
    if (ipArray.length === 0) {
      this.toast.error('Please enter at least one valid IP address.');
      return;
    }
    
    this.editingAudit.ip_details_array = ipArray;
    this.editingAudit.number_ip = ipArray.length;
    
    // Update the audit in the list
    const index = this.all_audits.findIndex(a => a.id === this.editingAudit!.id);
    if (index !== -1) {
      this.all_audits[index] = { ...this.editingAudit };
      this.filtered_list = [...this.all_audits];
      
      // Here you would call your API to update the audit
      this.updateAuditOnServer(this.editingAudit);
    }
    
    this.editingAudit = null;
    this.editAuditBackup = null;
    this.cdr.detectChanges();
  }
  
  // Update audit on server
  private updateAuditOnServer(audit: AsvAuditDisplay): void {
    this.isLoading = true;
    const url=`http://pci.accric.com/api/auth/update-asv/${audit.asv_id}` // Update with your actual endpoint
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    
    // Prepare payload according to your API format
    const payload = {
      number_of_ip: audit.number_ip,
      associated_organization: audit.associated_organization,
      associated_application: audit.associated_application,
      ip_details: audit.ip_details_array.map(ip => ({ ip })),
      status: audit.status
    };
    
    this.http.put<any>(url, payload, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toast.success(response.message || 'Audit updated successfully!');
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating audit:', error);
        this.toast.error(error.error?.message || 'Failed to update audit. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
  
  // Delete audit
  deleteAudit(audit: AsvAuditDisplay): void {
    if (confirm(`Are you sure you want to delete ASV audit for ${audit.project_name}?`)) {
      this.isLoading = true;
      const url = `http://pci.accric.com/api/auth/delete-asv-audit/${audit.asv_id}`; // Update with your actual endpoint
      const token = localStorage.getItem('jwt');
      
      if (!token) {
        this.toast.error('Please login first. No authentication token found.');
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      
      this.http.delete<any>(url, { headers }).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Remove from local list
          this.all_audits = this.all_audits.filter(a => a.id !== audit.id);
          this.filtered_list = [...this.all_audits];
          this.toast.success(response.message || 'Audit deleted successfully!');
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting audit:', error);
          this.toast.error(error.error?.message || 'Failed to delete audit. Please try again.');
          this.cdr.detectChanges();
        }
      });
    }
  }
  
  // Export to Excel
  exportToExcel(): void {
    if (this.filtered_list.length === 0) {
      this.toast.error('No data to export.');
      return;
    }
    
    try {
      // Prepare data for Excel
      const exportData = this.filtered_list.map(audit => ({
        'Company Name': audit.company_name,
        'Project Name': audit.project_name,
        'Number of IP': audit.number_ip,
        'Associated Organization': audit.associated_organization,
        'Associated Application': audit.associated_application,
        'IP Details': audit.ip_details,
        'Status': this.getStatusLabel(audit.status),
        'Created Date': this.formatDate(audit.created_at),
        'Last Updated': this.formatDate(audit.updated_at)
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ASV Audits');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'asv_audits');
      
      this.toast.success('Data exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.toast.error('Failed to export data to Excel.');
    }
  }
  
  // Save Excel file
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}