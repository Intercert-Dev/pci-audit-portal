import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface PCIReport {
  id: string;
  client: string;
  audit: string;
  associated_organization: string;
  associated_application: string;
  prev_aoc_report: any[];
  prev_roc_report: any[];
  prev_final_report: any[];
  current_aoc_report: any[];
  current_roc_report: any[];
  current_final_report: any[];
  verification_status: string;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
}

interface ReportFile {
  id: string;
  filename: string;
  file_name?: string;
  file_type: string;
  path: string;
  file_path?: string;
  report_id: string;
  created_at: string;
}

interface VerificationData {
  status: string;
  notes: string;
  verified_by: string;
}

@Component({
  selector: 'app-pci-reports-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './pci-reports-list.html',
  styleUrls: ['./pci-reports-list.css'],
})
export class PciReportsList implements OnInit {
  // Main data arrays
  reports_list: PCIReport[] = [];
  filtered_list: PCIReport[] = [];
  
  // Search functionality
  search_text: string = '';
  
  // Loading states
  isLoading: boolean = false;
  isExporting: boolean = false;
  
  // Popup states
  viewingReport: PCIReport | null = null;
  verifyingReport: PCIReport | null = null;
  
  // Verification form data
  verificationData: VerificationData = {
    status: '',
    notes: '',
    verified_by: ''
  };
  
  // Status mapping
  statusLabels: { [key: string]: string } = {
    'VERIFIED': 'Verified',
    'PENDING': 'Pending',
    'REJECTED': 'Rejected',
    'PENDING_REVIEW': 'Pending Review',
    'NEEDS_REVISION': 'Needs Revision',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed'
  };
  
  // Status class mapping
  statusClasses: { [key: string]: string } = {
    'VERIFIED': 'verified',
    'PENDING': 'pending',
    'REJECTED': 'rejected',
    'PENDING_REVIEW': 'review',
    'NEEDS_REVISION': 'review',
    'IN_PROGRESS': 'review',
    'COMPLETED': 'verified'
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  // Load reports from API
  loadReports() {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/report-verification-list';
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
        console.log("response data", res);
        
        // Transform API response to match PCIReport interface
        this.reports_list = res.data.map(report => ({
          id: report.report_verification_id,
          client: report.client || '',
          audit: report.audit || '',
          associated_organization: report.associated_organization || '',
          associated_application: report.associated_application || '',
          prev_aoc_report: Array.isArray(report.prev_aoc_report) ? report.prev_aoc_report : [],
          prev_roc_report: Array.isArray(report.prev_roc_report) ? report.prev_roc_report : [],
          prev_final_report: Array.isArray(report.prev_final_report) ? report.prev_final_report : [],
          current_aoc_report: Array.isArray(report.current_aoc_report) ? report.current_aoc_report : [],
          current_roc_report: Array.isArray(report.current_roc_report) ? report.current_roc_report : [],
          current_final_report: Array.isArray(report.current_final_report) ? report.current_final_report : [],
          verification_status: report.verification_status || 'PENDING',
          created_at: report.created_at || report.createdAt || new Date().toISOString(),
          updated_at: report.updated_at || report.updatedAt || new Date().toISOString(),
          verified_at: report.verified_at,
          verified_by: report.verified_by,
          verification_notes: report.verification_notes
        }));
        
        this.filtered_list = [...this.reports_list];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.isLoading = false;
        alert('Failed to load reports. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // Filter reports based on search text
  filter_list() {
    if (!this.search_text.trim()) {
      this.filtered_list = [...this.reports_list];
    } else {
      const searchTerm = this.search_text.toLowerCase().trim();
      this.filtered_list = this.reports_list.filter(report => 
        report.associated_organization?.toLowerCase().includes(searchTerm) ||
        report.associated_application?.toLowerCase().includes(searchTerm) ||
        report.verification_status?.toLowerCase().includes(searchTerm) ||
        report.verified_by?.toLowerCase().includes(searchTerm)
      );
    }
    this.cdr.detectChanges();
  }

  // Get status label for display
  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  // Get status class for styling
  getStatusClass(status: string): string {
    return this.statusClasses[status] || 'pending';
  }

  // Format date for display - UPDATED to handle undefined/null
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get file count by report type
  getReportFileCount(report: PCIReport, reportType: string): number {
    if (!report) return 0;
    
    switch(reportType) {
      case 'prev_aoc_report':
        return Array.isArray(report.prev_aoc_report) ? report.prev_aoc_report.length : 0;
      case 'prev_roc_report':
        return Array.isArray(report.prev_roc_report) ? report.prev_roc_report.length : 0;
      case 'prev_final_report':
        return Array.isArray(report.prev_final_report) ? report.prev_final_report.length : 0;
      case 'current_aoc_report':
        return Array.isArray(report.current_aoc_report) ? report.current_aoc_report.length : 0;
      case 'current_roc_report':
        return Array.isArray(report.current_roc_report) ? report.current_roc_report.length : 0;
      case 'current_final_report':
        return Array.isArray(report.current_final_report) ? report.current_final_report.length : 0;
      default:
        return 0;
    }
  }

  // Get file name from file object
  getFileName(file: any): string {
    return file.filename || file.file_name || 'Unnamed file';
  }

  // View report details
  viewReport(report: PCIReport) {
    // If report doesn't have file details, fetch them
    if (report.id) {
      this.fetchReportDetails(report.id).then(detailedReport => {
        this.viewingReport = detailedReport;
        this.cdr.detectChanges();
      }).catch(error => {
        console.error('Error fetching report details:', error);
        this.viewingReport = report;
        this.cdr.detectChanges();
      });
    } else {
      this.viewingReport = report;
      this.cdr.detectChanges();
    }
  }

  // Fetch detailed report with files
  async fetchReportDetails(reportId: string): Promise<PCIReport> {
    const token = localStorage.getItem("jwt");
    if (!token) throw new Error('No authentication token found');
    
    const url = `http://pci.accric.com/api/auth/report-verification/${reportId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    try {
      const response = await this.http.get<any>(url, { headers }).toPromise();
      
      return {
        id: response.report_verification_id,
        client: response.client || '',
        audit: response.audit || '',
        associated_organization: response.associated_organization || '',
        associated_application: response.associated_application || '',
        prev_aoc_report: Array.isArray(response.prev_aoc_report) ? response.prev_aoc_report : [],
        prev_roc_report: Array.isArray(response.prev_roc_report) ? response.prev_roc_report : [],
        prev_final_report: Array.isArray(response.prev_final_report) ? response.prev_final_report : [],
        current_aoc_report: Array.isArray(response.current_aoc_report) ? response.current_aoc_report : [],
        current_roc_report: Array.isArray(response.current_roc_report) ? response.current_roc_report : [],
        current_final_report: Array.isArray(response.current_final_report) ? response.current_final_report : [],
        verification_status: response.verification_status || 'PENDING',
        created_at: response.created_at || response.createdAt || new Date().toISOString(),
        updated_at: response.updated_at || response.updatedAt || new Date().toISOString(),
        verified_at: response.verified_at,
        verified_by: response.verified_by,
        verification_notes: response.verification_notes
      };
    } catch (error) {
      console.error('Error fetching report details:', error);
      throw error;
    }
  }

  // Close view popup
  closeView() {
    this.viewingReport = null;
    this.cdr.detectChanges();
  }

  // Edit report
  editReport(report: PCIReport) {
    alert(`Edit functionality for report: ${report.associated_organization}`);
    // You can navigate to edit page or open edit popup
  }

  // Open verify popup
  verifyReport(report: PCIReport) {
    this.verifyingReport = report;
    this.verificationData = {
      status: report.verification_status || 'PENDING_REVIEW',
      notes: report.verification_notes || '',
      verified_by: report.verified_by || ''
    };
    this.cdr.detectChanges();
  }

  // Cancel verification
  cancelVerify() {
    this.verifyingReport = null;
    this.verificationData = {
      status: '',
      notes: '',
      verified_by: ''
    };
    this.cdr.detectChanges();
  }

  // Submit verification
  submitVerification() {
    if (!this.verifyingReport) return;
    
    if (!this.verificationData.status) {
      alert('Please select a verification status');
      return;
    }
    
    if (!this.verificationData.verified_by) {
      alert('Please enter your name in "Verified By" field');
      return;
    }
    
    this.updateReportVerification();
  }

  // Update report verification status
  updateReportVerification() {
    if (!this.verifyingReport) return;
    
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }
    
    const url = `http://pci.accric.com/api/auth/update-report-verification/${this.verifyingReport.id}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    const payload = {
      verification_status: this.verificationData.status,
      verification_notes: this.verificationData.notes,
      verified_by: this.verificationData.verified_by,
      verified_at: new Date().toISOString()
    };
    
    this.http.put(url, payload, { headers }).subscribe({
      next: (response: any) => {
        alert('Report verification updated successfully!');
        
        // Update the local report data
        const index = this.reports_list.findIndex(r => r.id === this.verifyingReport?.id);
        if (index !== -1) {
          this.reports_list[index] = {
            ...this.reports_list[index],
            verification_status: this.verificationData.status,
            verification_notes: this.verificationData.notes,
            verified_by: this.verificationData.verified_by,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Update filtered list
          this.filtered_list = [...this.reports_list];
        }
        
        // Close popups
        this.verifyingReport = null;
        this.viewingReport = null;
        this.verificationData = {
          status: '',
          notes: '',
          verified_by: ''
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating verification:', error);
        let errorMessage = 'Failed to update verification. ';
        
        if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else if (error.status === 401) {
          errorMessage += 'Unauthorized. Please check your authentication token.';
        } else if (error.status === 400) {
          errorMessage += 'Bad request. Please check the data you entered.';
        } else if (error.status === 404) {
          errorMessage += 'Report not found.';
        } else if (error.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        }
        
        alert(errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  // Download individual file
  downloadFile(file: any) {
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }
    
    // Get file path
    const filePath = file.path || file.file_path;
    if (!filePath) {
      alert('File path not found');
      return;
    }
    
    // Construct full URL
    const fileUrl = filePath.startsWith('http') 
      ? filePath 
      : `http://pci.accric.com${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = this.getFileName(file);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export to Excel
  exportToExcel() {
    this.isExporting = true;
    this.cdr.detectChanges();
    
    try {
      // Prepare data for Excel
      const excelData = this.filtered_list.map(report => ({
        'Company Name': report.associated_organization || 'N/A',
        'Assessment/Project': report.associated_application || 'N/A',
        'Previous AOC Reports': this.getReportFileCount(report, 'prev_aoc_report'),
        'Previous ROC Reports': this.getReportFileCount(report, 'prev_roc_report'),
        'Previous Final Reports': this.getReportFileCount(report, 'prev_final_report'),
        'Current AOC Reports': this.getReportFileCount(report, 'current_aoc_report'),
        'Current ROC Reports': this.getReportFileCount(report, 'current_roc_report'),
        'Current Final Reports': this.getReportFileCount(report, 'current_final_report'),
        'Verification Status': this.getStatusLabel(report.verification_status),
        'Submitted Date': this.formatDate(report.created_at),
        'Verified Date': report.verified_at ? this.formatDate(report.verified_at) : 'Not Verified',
        'Verified By': report.verified_by || 'N/A',
        'Verification Notes': report.verification_notes || 'N/A'
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PCI Reports');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Save file
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `PCI_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }

  // Refresh reports list
  refreshReports() {
    this.loadReports();
  }
}