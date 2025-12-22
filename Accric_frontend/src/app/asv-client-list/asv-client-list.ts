import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../service/toast-service';

// Interface for API Response
interface AsvAuditResponse {
  asv_id: string;
  associated_application: string;
  associated_organization: string;
  audit: {
    assessment_project_name: string;
    id?: string;
  };
  client: {
    legal_entity_name: string;
    trading_name: string | null;
    id?: string;
  };
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interface for Display Data
interface ClientData {
  company: string;
  assessment: string;
  Q1: string;
  Q2: string;
  Q3: string;
  Q4: string;
  rawData?: AsvAuditResponse;
}

// Interface for Edit Row
interface EditingRowData {
  id?: string;
  company: string;
  assessment: string;
  Q1: string;
  Q2: string;
  Q3: string;
  Q4: string;
  Q1File?: File;
  Q2File?: File;
  Q3File?: File;
  Q4File?: File;
  Q1Status: string;
  Q2Status: string;
  Q3Status: string;
  Q4Status: string;
  rawData?: AsvAuditResponse;
}

// Interface for Company
interface Company {
  id: string;
  name: string;
}

// Interface for Assessment
interface Assessment {
  id: string;
  name: string;
}

@Component({
  selector: 'app-asv-client-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './asv-client-list.html',
  styleUrls: ['./asv-client-list.css']
})
export class AsvClientList implements OnInit {
  search_text: string = "";
  filtered_list: ClientData[] = [];
  all_audits: ClientData[] = [];
  isLoading: boolean = false;

  // Edit Popup Variables
  showEditPopup: boolean = false;
  editingRow: EditingRowData = {
    company: '',
    assessment: '',
    Q1: '',
    Q2: '',
    Q3: '',
    Q4: '',
    Q1Status: 'PENDING',
    Q2Status: 'PENDING',
    Q3Status: 'PENDING',
    Q4Status: 'PENDING'
  };

  // Company and Assessment Search Variables
  companySearch: string = '';
  assessmentSearch: string = '';
  isCompanyOpen: boolean = false;
  isAssessmentOpen: boolean = false;
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  assessments: Assessment[] = [];
  filteredAssessmentList: Assessment[] = [];
  selectedCompany: Company | null = null;
  selectedAssessment: Assessment | null = null;

  // File Input References
  @ViewChild('Q1Input') Q1Input!: ElementRef;
  @ViewChild('Q2Input') Q2Input!: ElementRef;
  @ViewChild('Q3Input') Q3Input!: ElementRef;
  @ViewChild('Q4Input') Q4Input!: ElementRef;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toast : ToastService
  ) { }

ngOnInit(): void {
    this.loadAsvAudits();
  }

loadAsvAudits(): void {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/asv-list';
    const token = localStorage.getItem('jwt');

    if (!token) {
      console.error('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ data: AsvAuditResponse[], message: string }>(url, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.all_audits = response.data.map(audit => this.mapAuditToDisplay(audit));
        this.filtered_list = [...this.all_audits];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading ASV audits:', error);
        this.cdr.detectChanges();
      }
    });
  }

 


  // Map API response to display format
  private mapAuditToDisplay(audit: AsvAuditResponse): ClientData {
    return {
      company: audit.client?.legal_entity_name ||
        audit.client?.trading_name ||
        audit.associated_organization ||
        'N/A',
      assessment: audit.audit?.assessment_project_name ||
        audit.associated_application ||
        'N/A',
      Q1: this.formatStatus(audit.q1),
      Q2: this.formatStatus(audit.q2),
      Q3: this.formatStatus(audit.q3),
      Q4: this.formatStatus(audit.q4),
      rawData: audit
    };
  }

  // Format status for display
  private formatStatus(status: string): string {
    if (!status) return 'Pending';

    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'INPROGRESS': 'In Progress',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started'
    };

    return statusMap[status.toUpperCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // For status badge CSS classes
  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'completed';
    if (statusLower.includes('in progress')) return 'in-progress';
    if (statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('not started')) return 'not-started';
    return '';
  }

  // Filter list based on search
  filter_list(): void {
    const search = this.search_text.toLowerCase();
    if (!search) {
      this.filtered_list = [...this.all_audits];
      return;
    }

    this.filtered_list = this.all_audits.filter(
      item => item.company.toLowerCase().includes(search) ||
        item.assessment.toLowerCase().includes(search)
    );
  }

  // Filter companies based on search
  filterCompanies(): void {
    const search = this.companySearch.toLowerCase();
    if (!search) {
      this.filteredCompanies = [...this.companies];
      return;
    }

    this.filteredCompanies = this.companies.filter(
      company => company.name.toLowerCase().includes(search)
    );
  }

  // Filter assessments based on search
  filterAssessments(): void {
    const search = this.assessmentSearch.toLowerCase();
    if (!search) {
      this.filteredAssessmentList = [...this.assessments];
      return;
    }

    this.filteredAssessmentList = this.assessments.filter(
      assessment => assessment.name.toLowerCase().includes(search)
    );
  }

  // Select company
  selectCompany(company: Company): void {
    this.selectedCompany = company;
    this.companySearch = company.name;
    this.isCompanyOpen = false;
    this.editingRow.company = company.name;

  
    this.assessmentSearch = '';
    this.selectedAssessment = null;
    this.isAssessmentOpen = false;

    this.cdr.detectChanges();
  }

  // Select assessment
  selectAssessment(assessment: Assessment): void {
    this.selectedAssessment = assessment;
    this.assessmentSearch = assessment.name;
    this.isAssessmentOpen = false;
    this.editingRow.assessment = assessment.name;

    this.cdr.detectChanges();
  }

  // Export to Excel
  exportToExcel(): void {
    if (this.filtered_list.length === 0) {
      console.warn('No data to export');
      return;
    }

    const fileName = 'ASV-Client-Certificates.xlsx';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filtered_list);
    const wb: XLSX.WorkBook = {
      Sheets: { 'Certificates': ws },
      SheetNames: ['Certificates']
    };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  // Edit row - open popup
  editRow(row: ClientData): void {
    this.showEditPopup = true;

    // Initialize editing row with data from table
    this.editingRow = {
      company: row.company,
      assessment: row.assessment,
      Q1: row.Q1,
      Q2: row.Q2,
      Q3: row.Q3,
      Q4: row.Q4,
      Q1Status: this.getStatusValue(row.Q1),
      Q2Status: this.getStatusValue(row.Q2),
      Q3Status: this.getStatusValue(row.Q3),
      Q4Status: this.getStatusValue(row.Q4),
      rawData: row.rawData
    };

    // Set company search
    this.companySearch = row.company;
    this.selectedCompany = null;

    // Set assessment search
    this.assessmentSearch = row.assessment;
    this.selectedAssessment = null;

    // Reset file inputs
    this.editingRow.Q1File = undefined;
    this.editingRow.Q2File = undefined;
    this.editingRow.Q3File = undefined;
    this.editingRow.Q4File = undefined;

    this.cdr.detectChanges();
  }

  // Convert display status to API status value
  private getStatusValue(displayStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'PENDING',
      'completed': 'COMPLETED',
      'in progress': 'INPROGRESS',
      'in_progress': 'INPROGRESS',
      'not started': 'NOT_STARTED'
    };

    const key = displayStatus.toLowerCase();
    return statusMap[key] || 'PENDING';
  }

  // Trigger file input
  triggerInput(quarter: string): void {
    switch (quarter) {
      case 'Q1':
        this.Q1Input.nativeElement.click();
        break;
      case 'Q2':
        this.Q2Input.nativeElement.click();
        break;
      case 'Q3':
        this.Q3Input.nativeElement.click();
        break;
      case 'Q4':
        this.Q4Input.nativeElement.click();
        break;
    }
  }

  // Handle file selection
  onFileSelect(event: Event, quarter: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      switch (quarter) {
        case 'Q1':
          this.editingRow.Q1File = file;
          break;
        case 'Q2':
          this.editingRow.Q2File = file;
          break;
        case 'Q3':
          this.editingRow.Q3File = file;
          break;
        case 'Q4':
          this.editingRow.Q4File = file;
          break;
      }

      // Also update the status when a file is uploaded
      switch (quarter) {
        case 'Q1':
          this.editingRow.Q1Status = 'COMPLETED';
          break;
        case 'Q2':
          this.editingRow.Q2Status = 'COMPLETED';
          break;
        case 'Q3':
          this.editingRow.Q3Status = 'COMPLETED';
          break;
        case 'Q4':
          this.editingRow.Q4Status = 'COMPLETED';
          break;
      }

      this.cdr.detectChanges();
    }
  }

  // Handle status change
  onStatusChange(quarter: string, status: string): void {
    // You can add any additional logic here when status changes
    console.log(`${quarter} status changed to: ${status}`);
  }

  // Preview file
  onPreview(quarter: string): void {
    let file: File | undefined;

    switch (quarter) {
      case 'Q1':
        file = this.editingRow.Q1File;
        break;
      case 'Q2':
        file = this.editingRow.Q2File;
        break;
      case 'Q3':
        file = this.editingRow.Q3File;
        break;
      case 'Q4':
        file = this.editingRow.Q4File;
        break;
    }

    if (file) {
      // For PDF files, you can use window.open with a blob URL
      if (file.type === 'application/pdf') {
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
      } else {
        // For other file types, you might want to download instead
        this.toast.warning(`Preview is only available for PDF files. Downloading ${file.name} instead.`);
        this.onDownload(quarter);
      }
    }
  }

  // Download file
  onDownload(quarter: string): void {
    let file: File | undefined;

    switch (quarter) {
      case 'Q1':
        file = this.editingRow.Q1File;
        break;
      case 'Q2':
        file = this.editingRow.Q2File;
        break;
      case 'Q3':
        file = this.editingRow.Q3File;
        break;
      case 'Q4':
        file = this.editingRow.Q4File;
        break;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

 saveEdit(): void {
  if (!this.editingRow.company || !this.editingRow.assessment) {
    return;
  }

  const asvId = this.editingRow.rawData?.asv_id;
  if (!asvId) {
    return;
  }

  const formData = new FormData();
  
  // 1. Core ID and Info (Matching the JSON structure)
  formData.append('asv_id', asvId);
  formData.append('associated_organization', this.editingRow.company);
  formData.append('associated_application', this.editingRow.assessment);
  
  // 2. Statuses (Matching JSON keys: q1, q2, q3, q4)
  formData.append('q1', this.editingRow.Q1Status);
  formData.append('q2', this.editingRow.Q2Status);
  formData.append('q3', this.editingRow.Q3Status);
  formData.append('q4', this.editingRow.Q4Status);

  // 3. Files (Standard practice uses q1_pdf or q1_file based on backend logic)
  if (this.editingRow.Q1File) {
    formData.append('q1_pdf', this.editingRow.Q1File);
  }
  if (this.editingRow.Q2File) {
    formData.append('q2_pdf', this.editingRow.Q2File);
  }
  if (this.editingRow.Q3File) {
    formData.append('q3_pdf', this.editingRow.Q3File);
  }
  if (this.editingRow.Q4File) {
    formData.append('q4_pdf', this.editingRow.Q4File);
  }

  this.updateAsvAudit(formData, asvId);
}

 private updateAsvAudit(formData: FormData, asvId: string): void {
  const token = localStorage.getItem('jwt');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
    // DO NOT add 'Content-Type': 'multipart/form-data' here
  });

  const url = `http://pci.accric.com/api/auth/update-asv/${asvId}`;

  this.http.put(url, formData, { headers }).subscribe({
    next: (response: any) => {
      this.toast.success('Updated Successfully');
      this.cancelEdit();
      this.loadAsvAudits();
    },
    error: (err) => {
      console.error(err);
      this.toast.error('Update failed. Check console for details.');
    }
  });
}



  // Cancel edit
  cancelEdit(): void {
    this.showEditPopup = false;
    this.resetEditForm();
  }

  // Reset edit form
  private resetEditForm(): void {
    this.editingRow = {
      company: '',
      assessment: '',
      Q1: '',
      Q2: '',
      Q3: '',
      Q4: '',
      Q1Status: 'PENDING',
      Q2Status: 'PENDING',
      Q3Status: 'PENDING',
      Q4Status: 'PENDING'
    };

    this.companySearch = '';
    this.assessmentSearch = '';
    this.selectedCompany = null;
    this.selectedAssessment = null;
    this.isCompanyOpen = false;
    this.isAssessmentOpen = false;

    // Reset file inputs
    if (this.Q1Input?.nativeElement) this.Q1Input.nativeElement.value = '';
    if (this.Q2Input?.nativeElement) this.Q2Input.nativeElement.value = '';
    if (this.Q3Input?.nativeElement) this.Q3Input.nativeElement.value = '';
    if (this.Q4Input?.nativeElement) this.Q4Input.nativeElement.value = '';
  }

  // Close dropdowns when clicking outside
  closeDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.search-dropdown')) {
      this.isCompanyOpen = false;
      this.isAssessmentOpen = false;
      this.cdr.detectChanges();
    }
  }

  // Handle document click to close dropdowns
  onDocumentClick(event: MouseEvent): void {
    this.closeDropdowns(event);
  }

  // Refresh data
  refreshData(): void {
    this.loadAsvAudits();
  }
}