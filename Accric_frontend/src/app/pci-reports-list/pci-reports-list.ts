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
  previous_files_count: number;
  current_files_count: number;
  previous_files?: ReportFile[];
  current_files?: ReportFile[];
  verification_status: string;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
}

interface ReportFile {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  report_id: string;
  file_category: 'previous' | 'current';
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
        this.reports_list = res.data.map(report => {
          // Calculate file counts based on your API response
          const prevAocCount = Array.isArray(report.prev_aoc_report) ? report.prev_aoc_report.length : 0;
          const prevRocCount = Array.isArray(report.prev_roc_report) ? report.prev_roc_report.length : 0;
          const prevFinalCount = Array.isArray(report.prev_final_report) ? report.prev_final_report.length : 0;
          
          const currentAocCount = Array.isArray(report.current_aoc_report) ? report.current_aoc_report.length : 0;
          const currentRocCount = Array.isArray(report.current_roc_report) ? report.current_roc_report.length : 0;
          const currentFinalCount = Array.isArray(report.current_final_report) ? report.current_final_report.length : 0;
          
          const previousFilesCount = prevAocCount + prevRocCount + prevFinalCount;
          const currentFilesCount = currentAocCount + currentRocCount + currentFinalCount;
          
          // Combine all previous files into one array
          const previousFiles: ReportFile[] = [];
          if (Array.isArray(report.prev_aoc_report)) {
            previousFiles.push(...report.prev_aoc_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'AOC Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'previous' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          if (Array.isArray(report.prev_roc_report)) {
            previousFiles.push(...report.prev_roc_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'ROC Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'previous' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          if (Array.isArray(report.prev_final_report)) {
            previousFiles.push(...report.prev_final_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'Final Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'previous' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          
          // Combine all current files into one array
          const currentFiles: ReportFile[] = [];
          if (Array.isArray(report.current_aoc_report)) {
            currentFiles.push(...report.current_aoc_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'AOC Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'current' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          if (Array.isArray(report.current_roc_report)) {
            currentFiles.push(...report.current_roc_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'ROC Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'current' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          if (Array.isArray(report.current_final_report)) {
            currentFiles.push(...report.current_final_report.map((file: any) => ({
              id: file.id || '',
              file_name: file.filename || file.file_name || 'Final Report',
              file_type: 'PDF',
              file_path: file.path || file.file_path || '',
              report_id: report.report_verification_id,
              file_category: 'current' as const,
              created_at: file.created_at || new Date().toISOString()
            })));
          }
          
          return {
            id: report.report_verification_id,
            client: report.client || '',
            audit: report.audit || '',
            associated_organization: report.associated_organization || '',
            associated_application: report.associated_application || '',
            previous_files_count: previousFilesCount,
            current_files_count: currentFilesCount,
            previous_files: previousFiles,
            current_files: currentFiles,
            verification_status: report.verification_status || 'PENDING',
            created_at: report.created_at || report.createdAt || new Date().toISOString(),
            updated_at: report.updated_at || report.updatedAt || new Date().toISOString(),
            verified_at: report.verified_at,
            verified_by: report.verified_by,
            verification_notes: report.verification_notes
          };
        });
        
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

  // View report details
  viewReport(report: PCIReport) {
    // If report doesn't have file details, fetch them
    if ((!report.previous_files || !report.current_files) && report.id) {
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
      
      // Process file arrays similar to loadReports
      const prevAocCount = Array.isArray(response.prev_aoc_report) ? response.prev_aoc_report.length : 0;
      const prevRocCount = Array.isArray(response.prev_roc_report) ? response.prev_roc_report.length : 0;
      const prevFinalCount = Array.isArray(response.prev_final_report) ? response.prev_final_report.length : 0;
      
      const currentAocCount = Array.isArray(response.current_aoc_report) ? response.current_aoc_report.length : 0;
      const currentRocCount = Array.isArray(response.current_roc_report) ? response.current_roc_report.length : 0;
      const currentFinalCount = Array.isArray(response.current_final_report) ? response.current_final_report.length : 0;
      
      const previousFilesCount = prevAocCount + prevRocCount + prevFinalCount;
      const currentFilesCount = currentAocCount + currentRocCount + currentFinalCount;
      
      // Combine all previous files
      const previousFiles: ReportFile[] = [];
      if (Array.isArray(response.prev_aoc_report)) {
        previousFiles.push(...response.prev_aoc_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'AOC Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'previous' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      if (Array.isArray(response.prev_roc_report)) {
        previousFiles.push(...response.prev_roc_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'ROC Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'previous' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      if (Array.isArray(response.prev_final_report)) {
        previousFiles.push(...response.prev_final_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'Final Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'previous' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      
      // Combine all current files
      const currentFiles: ReportFile[] = [];
      if (Array.isArray(response.current_aoc_report)) {
        currentFiles.push(...response.current_aoc_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'AOC Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'current' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      if (Array.isArray(response.current_roc_report)) {
        currentFiles.push(...response.current_roc_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'ROC Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'current' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      if (Array.isArray(response.current_final_report)) {
        currentFiles.push(...response.current_final_report.map((file: any) => ({
          id: file.id || '',
          file_name: file.filename || file.file_name || 'Final Report',
          file_type: 'PDF',
          file_path: file.path || file.file_path || '',
          report_id: response.report_verification_id,
          file_category: 'current' as const,
          created_at: file.created_at || new Date().toISOString()
        })));
      }
      
      return {
        id: response.report_verification_id,
        client: response.client || '',
        audit: response.audit || '',
        associated_organization: response.associated_organization || '',
        associated_application: response.associated_application || '',
        previous_files_count: previousFilesCount,
        current_files_count: currentFilesCount,
        previous_files: previousFiles,
        current_files: currentFiles,
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

  // Edit report (placeholder - you can implement as needed)
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
  downloadFile(file: ReportFile) {
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }
    
    // Construct full URL if needed
    const fileUrl = file.file_path.startsWith('http') 
      ? file.file_path 
      : `http://pci.accric.com${file.file_path.startsWith('/') ? '' : '/'}${file.file_path}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download all reports for a specific report
  downloadReport(report: PCIReport) {
    alert(`Downloading all files for: ${report.associated_organization}`);
    // Implement bulk download logic here
    // You might want to create a ZIP file of all attachments
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
        'Previous Reports': report.previous_files_count,
        'Current Reports': report.current_files_count,
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

  // Additional helper method to count files by category
  countFilesByCategory(report: PCIReport, category: 'previous' | 'current'): number {
    if (category === 'previous' && report.previous_files) {
      return report.previous_files.length;
    } else if (category === 'current' && report.current_files) {
      return report.current_files.length;
    }
    return 0;
  }

  // Get file list by category
  getFilesByCategory(report: PCIReport, category: 'previous' | 'current'): ReportFile[] {
    if (category === 'previous' && report.previous_files) {
      return report.previous_files;
    } else if (category === 'current' && report.current_files) {
      return report.current_files;
    }
    return [];
  }

  // Refresh reports list
  refreshReports() {
    this.loadReports();
  }
}