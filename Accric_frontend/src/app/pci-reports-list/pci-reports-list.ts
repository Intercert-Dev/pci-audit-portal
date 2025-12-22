import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NgIf } from '@angular/common'; // Add this import

interface FileObject {
  filename: string;
  file_name: string;
  url: string;
  path: string;
  file_path: string;
  file_type: string;
  created_at?: string;
  file?: File; // For new uploads
  isNew?: boolean; // Add this property to fix the error
}

interface PCIReport {
  id: string;
  client: string;
  audit: string;
  associated_organization: string;
  associated_application: string;
  prev_aoc_report: FileObject[];
  prev_roc_report: FileObject[];
  prev_final_report: FileObject[];
  current_aoc_report: FileObject[];
  current_roc_report: FileObject[];
  current_final_report: FileObject[];
  verification_status: string;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  [key: string]: any;
}

interface VerificationData {
  status: string;
  notes: string;
  verified_by: string;
}

@Component({
  selector: 'app-pci-reports-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf], // Add NgIf here
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
  isSaving: boolean = false;
  isUploading: boolean = false;
  
  // Popup states
  viewingReport: PCIReport | null = null;
  verifyingReport: PCIReport | null = null;
  editingReport: PCIReport | null = null;
  
  // File viewer state
  viewingFiles: boolean = false;
  selectedFiles: FileObject[] = [];
  selectedFileCategory: string = '';
  selectedFileType: string = '';
  
  // Form data for popups
  verificationData: VerificationData = {
    status: '',
    notes: '',
    verified_by: ''
  };
  
  // Edit form data
  editFormData: any = {};
  
  // File upload tracking
  filesToRemove: string[] = []; // URLs of files to remove
  newFilesToUpload: {category: string, type: string, files: File[]}[] = [];
  
  // Status options for dropdown
  statusOptions = [
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'NEEDS_REVISION', label: 'Needs Revision' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];
  
  // Status mapping for display
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

  // File input references
  @ViewChild('prevAocFileInput') prevAocFileInput!: ElementRef;
  @ViewChild('prevRocFileInput') prevRocFileInput!: ElementRef;
  @ViewChild('prevFinalFileInput') prevFinalFileInput!: ElementRef;
  @ViewChild('currentAocFileInput') currentAocFileInput!: ElementRef;
  @ViewChild('currentRocFileInput') currentRocFileInput!: ElementRef;
  @ViewChild('currentFinalFileInput') currentFinalFileInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  // ==================== REPORT METHODS ====================
  
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

    this.http.get<{data: any[], message: string}>(url, { headers }).subscribe({
      next: (res) => {
        console.log("API response data:", res);
        
        // Transform API response to match PCIReport interface
        this.reports_list = res.data.map(report => {
          // Create a report object with proper file structure
          const processedReport: PCIReport = {
            id: report.report_verification_id || report.id || '',
            client: report.client || '',
            audit: report.audit || '',
            associated_organization: report.associated_organization || '',
            associated_application: report.associated_application || '',
            prev_aoc_report: this.processFileArray(report.prev_aoc_report, 'prev', 'aoc'),
            prev_roc_report: this.processFileArray(report.prev_roc_report, 'prev', 'roc'),
            prev_final_report: this.processFileArray(report.prev_final_report, 'prev', 'final'),
            current_aoc_report: this.processFileArray(report.current_aoc_report, 'current', 'aoc'),
            current_roc_report: this.processFileArray(report.current_roc_report, 'current', 'roc'),
            current_final_report: this.processFileArray(report.current_final_report, 'current', 'final'),
            verification_status: report.verification_status || 'PENDING',
            created_at: report.created_at || report.createdAt || new Date().toISOString(),
            updated_at: report.updated_at || report.updatedAt || new Date().toISOString(),
            verified_at: report.verified_at,
            verified_by: report.verified_by,
            verification_notes: report.verification_notes
          };
          
          return processedReport;
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

  // Process file array - handles both string URLs and file objects
  private processFileArray(files: any, category: string, type: string): FileObject[] {
    if (!files) return [];
    
    // If it's null, return empty array
    if (files === null) return [];
    
    // If it's a single URL string, convert to array
    if (typeof files === 'string') {
      files = [files];
    }
    
    // Ensure it's an array
    if (!Array.isArray(files)) {
      console.warn(`Files for ${category}_${type} is not an array:`, files);
      return [];
    }
    
    return files.map((file: any, index: number) => {
      // If file is a string URL
      if (typeof file === 'string') {
        const url = file;
        const filename = this.extractFileNameFromUrl(url);
        const fileType = this.getFileTypeFromUrl(url);
        
        return {
          filename: filename,
          file_name: filename,
          url: url,
          path: url,
          file_path: url,
          file_type: fileType,
          created_at: new Date().toISOString(),
          isNew: false
        };
      }
      
      // If file is an object
      if (file && typeof file === 'object') {
        const url = file.url || file.path || file.file_path || '';
        const filename = file.filename || file.file_name || this.extractFileNameFromUrl(url);
        const fileType = file.file_type || this.getFileTypeFromUrl(url);
        
        return {
          filename: filename,
          file_name: filename,
          url: url,
          path: url,
          file_path: url,
          file_type: fileType,
          created_at: file.created_at || new Date().toISOString(),
          isNew: file.isNew || false,
          ...file
        };
      }
      
      // Fallback
      return {
        filename: `file-${index + 1}`,
        file_name: `file-${index + 1}`,
        url: '',
        path: '',
        file_path: '',
        file_type: 'unknown',
        created_at: new Date().toISOString(),
        isNew: false
      };
    });
  }

  // Extract filename from URL
  private extractFileNameFromUrl(url: string): string {
    if (!url) return 'Unnamed file';
    
    try {
      // Decode URL to handle encoded characters
      const decodedUrl = decodeURIComponent(url);
      
      // Extract filename from URL
      const urlParts = decodedUrl.split('/');
      let filename = urlParts[urlParts.length - 1];
      
      // Remove query parameters if any
      filename = filename.split('?')[0];
      
      // If filename contains a dash-separated timestamp like "IntercertCertificate-1766057054775-tx680h464h.pdf"
      // We can clean it up to show a better name
      if (filename) {
        // Remove the timestamp and random string if present
        // Pattern: name-timestamp-randomstring.ext
        const nameParts = filename.split('-');
        if (nameParts.length >= 3) {
          // Keep the first part as the name
          const extension = nameParts[nameParts.length - 1].split('.')[1] || '';
          const cleanName = nameParts[0];
          return extension ? `${cleanName}.${extension}` : cleanName;
        }
      }
      
      return filename || 'Unnamed file';
    } catch (error) {
      console.error('Error extracting filename from URL:', error, url);
      return 'Unnamed file';
    }
  }

  // Get file type from URL
  private getFileTypeFromUrl(url: string): string {
    if (!url) return 'unknown';
    
    const filename = this.extractFileNameFromUrl(url);
    const extension = filename.toLowerCase().split('.').pop();
    
    if (!extension) return 'unknown';
    
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
    
    return 'file';
  }

  // Filter reports based on search text
  filter_list() {
    if (!this.search_text.trim()) {
      this.filtered_list = [...this.reports_list];
    } else {
      const searchTerm = this.search_text.toLowerCase().trim();
      this.filtered_list = this.reports_list.filter(report => 
        (report.associated_organization || '').toLowerCase().includes(searchTerm) ||
        (report.associated_application || '').toLowerCase().includes(searchTerm) ||
        (report.verification_status || '').toLowerCase().includes(searchTerm) ||
        (report.verified_by || '').toLowerCase().includes(searchTerm) ||
        (report.client || '').toLowerCase().includes(searchTerm)
      );
    }
    this.cdr.detectChanges();
  }


 editReport(report: PCIReport) {
  // Deep copy for safe editing
  this.editingReport = JSON.parse(JSON.stringify(report));

  this.editFormData = {
    associated_organization: report.associated_organization || '',
    associated_application: report.associated_application || '',
    client: report.client || '',
    audit: report.audit || '',
    verification_status: report.verification_status || '',
    verification_notes: report.verification_notes || '',
    verified_by: report.verified_by || '',
    verified_at: report.verified_at || null
  };

  this.cdr.detectChanges();
}



  // Cancel edit
  cancelEdit() {
    this.editingReport = null;
    this.editFormData = {};
    this.filesToRemove = [];
    this.newFilesToUpload = [];
    this.cdr.detectChanges();
  }

  // ==================== FILE UPLOAD METHODS ====================
  
  // Trigger file input click
  triggerFileInput(category: 'prev' | 'current', type: 'aoc' | 'roc' | 'final') {
    const inputId = `${category}${type.charAt(0).toUpperCase() + type.slice(1)}FileInput`;
    const fileInput = (this as any)[inputId];
    
    if (fileInput && fileInput.nativeElement) {
      fileInput.nativeElement.click();
    }
  }

  // Handle file selection
  onFileSelected(event: Event, category: 'prev' | 'current', type: 'aoc' | 'roc' | 'final') {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Validate files are PDFs
      const invalidFiles = files.filter(file => !file.name.toLowerCase().endsWith('.pdf'));
      if (invalidFiles.length > 0) {
        alert('Only PDF files are allowed. Please select PDF files only.');
        input.value = '';
        return;
      }
      
      // Create FileObjects for new files
      const newFileObjects: FileObject[] = files.map(file => ({
        filename: file.name,
        file_name: file.name,
        url: '',
        path: '',
        file_path: '',
        file_type: 'pdf',
        created_at: new Date().toISOString(),
        file: file, // Store the actual File object
        isNew: true // Mark as new file
      }));
      
      // Add to editingReport
      const prop = `${category}_${type}_report` as keyof PCIReport;
      if (this.editingReport) {
        if (!this.editingReport[prop]) {
          this.editingReport[prop] = [];
        }
        
        // Add new files to the beginning
        this.editingReport[prop] = [...newFileObjects, ...this.editingReport[prop]];
        
        // Track for upload
        this.newFilesToUpload.push({
          category,
          type,
          files
        });
      }
      
      // Reset file input
      input.value = '';
      
      this.cdr.detectChanges();
    }
  }

  // Remove a file
  removeFile(category: 'prev' | 'current', type: 'aoc' | 'roc' | 'final', index: number) {
    if (!this.editingReport) return;
    
    const prop = `${category}_${type}_report` as keyof PCIReport;
    const files = this.editingReport[prop] as FileObject[];
    
    if (index >= 0 && index < files.length) {
      const fileToRemove = files[index];
      
      // If it's an existing file (has URL), add to remove list
      if (fileToRemove.url && !fileToRemove.isNew) {
        this.filesToRemove.push(fileToRemove.url);
      }
      
      // If it's a new file (not uploaded yet), remove from upload list
      if (fileToRemove.isNew) {
        const uploadIndex = this.newFilesToUpload.findIndex(
          upload => upload.category === category && upload.type === type
        );
        
        if (uploadIndex !== -1) {
          // Remove the specific file from the upload list
          const fileToRemoveName = fileToRemove.filename;
          this.newFilesToUpload[uploadIndex].files = this.newFilesToUpload[uploadIndex].files.filter(
            file => file.name !== fileToRemoveName
          );
          
          // If no files left in this category, remove the entry
          if (this.newFilesToUpload[uploadIndex].files.length === 0) {
            this.newFilesToUpload.splice(uploadIndex, 1);
          }
        }
      }
      
      // Remove from the display array
      files.splice(index, 1);
      
      this.cdr.detectChanges();
    }
  }

  // ==================== SAVE REPORT WITH FILES ====================
  
  // Save edited report with file uploads
  async saveReport() {
    if (!this.editingReport || !this.editingReport.id) return;
    
    if (!this.editFormData.associated_organization || !this.editFormData.associated_application) {
      alert('Organization and Application are required fields.');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        alert('Please login first. No authentication token found.');
        this.isSaving = false;
        this.cdr.detectChanges();
        return;
      }
      
      // Step 1: Upload new files if any
      const uploadedFileUrls = await this.uploadNewFiles(token);
      
      // Step 2: Update report with new file URLs
      this.updateReportWithNewFileUrls(uploadedFileUrls);
      
      // Step 3: Prepare report data for update
      const reportUpdateData = await this.prepareReportUpdateData(token);
      
      // Step 4: Send update request
      await this.sendReportUpdateRequest(token, reportUpdateData);
      
      // Success
      alert('Report updated successfully!');
      this.loadReports(); // Refresh the list
      this.cancelEdit(); // Close popup
      
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to update report. Please try again.');
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // Upload new files to server
  private async uploadNewFiles(token: string): Promise<{url: string, category: string, type: string}[]> {
    if (this.newFilesToUpload.length === 0) return [];
    
    const uploadedUrls: {url: string, category: string, type: string}[] = [];
    
    for (const upload of this.newFilesToUpload) {
      for (const file of upload.files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('reportId', this.editingReport!.id);
          formData.append('category', upload.category);
          formData.append('type', upload.type);
          
          const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
            // Note: Don't set Content-Type for FormData, let browser set it
          });
          
          const uploadUrl = 'http://pci.accric.com/api/auth/upload-report-file';
          const response = await this.http.post<{url: string, message: string}>(uploadUrl, formData, { headers }).toPromise();
          
          if (response && response.url) {
            uploadedUrls.push({
              url: response.url,
              category: upload.category,
              type: upload.type
            });
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Failed to upload file: ${file.name}`);
        }
      }
    }
    
    return uploadedUrls;
  }

  // Update report data with new file URLs
  private updateReportWithNewFileUrls(uploadedFileUrls: {url: string, category: string, type: string}[]) {
    if (!this.editingReport) return;
    
    // Group uploaded URLs by category and type
    const urlMap: {[key: string]: string[]} = {};
    
    uploadedFileUrls.forEach(item => {
      const key = `${item.category}_${item.type}`;
      if (!urlMap[key]) urlMap[key] = [];
      urlMap[key].push(item.url);
    });
    
    // Update the editingReport with new URLs
    Object.keys(urlMap).forEach(key => {
      const [category, type] = key.split('_');
      const prop = `${category}_${type}_report` as keyof PCIReport;
      
      if (this.editingReport && this.editingReport[prop]) {
        // Update new files with their URLs
        this.editingReport[prop] = this.editingReport[prop].map((file: FileObject) => {
          if (file.isNew && !file.url) {
            // Find matching URL by filename
            const matchingUrl = urlMap[key].find(url => 
              this.extractFileNameFromUrl(url) === file.filename
            );
            
            if (matchingUrl) {
              return {
                ...file,
                url: matchingUrl,
                path: matchingUrl,
                file_path: matchingUrl
              };
            }
          }
          return file;
        });
      }
    });
  }

  // Prepare report update data
  private async prepareReportUpdateData(token: string): Promise<any> {
    if (!this.editingReport) return {};
    
    // Filter out new files (they will be added via separate API or included in update)
    const payload: any = {
      associated_organization: this.editFormData.associated_organization,
      associated_application: this.editFormData.associated_application,
      client: this.editFormData.client,
      audit: this.editFormData.audit,
      verification_status: this.editFormData.verification_status,
      verification_notes: this.editFormData.verification_notes,
      verified_by: this.editFormData.verified_by,
      verified_at: this.editFormData.verified_at || null
    };
    
    // Only include existing file URLs (not new ones)
    ['prev_aoc_report', 'prev_roc_report', 'prev_final_report', 
     'current_aoc_report', 'current_roc_report', 'current_final_report'].forEach(prop => {
      if (this.editingReport && this.editingReport[prop]) {
        // Filter out new files and get URLs of existing files
        const existingFileUrls = (this.editingReport[prop] as FileObject[])
          .filter((file: FileObject) => !file.isNew && file.url)
          .map((file: FileObject) => file.url);
        
        payload[prop] = existingFileUrls;
      }
    });
    
    return payload;
  }

  // Send report update request
  private async sendReportUpdateRequest(token: string, payload: any): Promise<void> {
    const url = `http://pci.accric.com/api/auth/update-report-verification/${this.editingReport!.id}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    
    await this.http.put(url, payload, { headers }).toPromise();
  }

  // ==================== UTILITY METHODS ====================
  
  // Get status label for display
  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  // Get status class for styling
  getStatusClass(status: string): string {
    return this.statusClasses[status] || 'pending';
  }

  // Format date for display
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
        return report.prev_aoc_report.length;
      case 'prev_roc_report':
        return report.prev_roc_report.length;
      case 'prev_final_report':
        return report.prev_final_report.length;
      case 'current_aoc_report':
        return report.current_aoc_report.length;
      case 'current_roc_report':
        return report.current_roc_report.length;
      case 'current_final_report':
        return report.current_final_report.length;
      default:
        return 0;
    }
  }

  // Get file name from file object
  getFileName(file: FileObject): string {
    if (!file) return 'Unnamed file';
    
    return file.filename || file.file_name || this.extractFileNameFromUrl(file.url) || 'Unnamed file';
  }

  // Get file download URL
  getFileDownloadUrl(file: FileObject): string {
    if (!file) return '#';
    
    const url = file.url || file.path || file.file_path;
    
    if (!url) return '#';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    return `http://pci.accric.com/${url.startsWith('/') ? url.substring(1) : url}`;
  }

  // Get file extension
  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  // Get file icon based on extension
  getFileIcon(fileName: string): string {
    const extension = this.getFileExtension(fileName);
    
    switch(extension) {
      case 'pdf':
        return '/assets/icons/pdf-icon.png';
      case 'doc':
      case 'docx':
        return '/assets/icons/doc-icon.png';
      case 'xls':
      case 'xlsx':
        return '/assets/icons/excel-icon.png';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '/assets/icons/image-icon.png';
      default:
        return '/assets/icons/file-icon.png';
    }
  }

  // Get category label
  getCategoryLabel(category: string): string {
    return category === 'prev' ? 'Previous' : 'Current';
  }

  // Get type full name
  getTypeFullName(type: string): string {
    const typeMap: {[key: string]: string} = {
      'AOC': 'Attestation of Compliance',
      'ROC': 'Report on Compliance',
      'FINAL': 'Final Report'
    };
    return typeMap[type] || type;
  }

  // ==================== VIEW REPORT METHODS ====================
  
  viewReport(report: PCIReport) {
    this.viewingReport = report;
    this.cdr.detectChanges();
  }

  closeView() {
    this.viewingReport = null;
    this.cdr.detectChanges();
  }

  // ==================== FILE VIEWER METHODS ====================
  
  viewReportFiles(category: 'prev' | 'current', type: string) {
    if (!this.editingReport) return;
    
    this.selectedFileCategory = category;
    this.selectedFileType = type;
    
    const fileProperty = `${category}_${type.toLowerCase()}_report` as keyof PCIReport;
    this.selectedFiles = (this.editingReport[fileProperty] as FileObject[]) || [];
    this.viewingFiles = true;
    
    this.cdr.detectChanges();
  }

  closeFileViewer() {
    this.viewingFiles = false;
    this.selectedFiles = [];
    this.selectedFileCategory = '';
    this.selectedFileType = '';
    this.cdr.detectChanges();
  }

  // ==================== VERIFICATION METHODS ====================
  
  verifyReport(report: PCIReport) {
    this.verifyingReport = report;
    this.verificationData = {
      status: report.verification_status || 'PENDING_REVIEW',
      notes: report.verification_notes || '',
      verified_by: report.verified_by || ''
    };
    this.cdr.detectChanges();
  }

  cancelVerify() {
    this.verifyingReport = null;
    this.verificationData = {
      status: '',
      notes: '',
      verified_by: ''
    };
    this.cdr.detectChanges();
  }

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
          
          this.filtered_list = [...this.reports_list];
        }
        
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

  // ==================== FILE OPERATIONS ====================
  
  downloadFile(file: FileObject) {
    if (!file) {
      alert('File not found');
      return;
    }
    
    const fileUrl = this.getFileDownloadUrl(file);
    
    if (fileUrl === '#') {
      alert('File URL not found');
      return;
    }
    
    const fileName = this.getFileName(file);
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== EXPORT METHODS ====================
  
  exportToExcel() {
    this.isExporting = true;
    this.cdr.detectChanges();
    
    try {
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
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PCI Reports');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
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
}