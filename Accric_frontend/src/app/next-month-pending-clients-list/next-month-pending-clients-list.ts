import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Interface for API Response
interface AsvPendingResponse {
  asv_id: string;
  number_of_ip: number;
  associated_organization: string;
  associated_application: string;
  ip_details: Array<{ ip: string }>;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q1_pdf: string | null;
  q2_pdf: string | null;
  q3_pdf: string | null;
  q4_pdf: string | null;
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
  status: string;
  numberOfIP: number;
  ips: string[];
  rawData?: AsvPendingResponse;
}

@Component({
  selector: 'app-next-month-pending-clients-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './next-month-pending-clients-list.html',
  styleUrl: './next-month-pending-clients-list.css'
})
export class NextMonthPendingClientsList implements OnInit {
  search_text: string = "";
  filtered_list: ClientData[] = [];
  all_audits: ClientData[] = [];
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadNextMonthPendingClients();
  }

  loadNextMonthPendingClients(): void {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/asv-pending-for-nextmonth';
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

    this.http.get<{ data: AsvPendingResponse[], message: string }>(url, { headers }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.message === "ASV pending reports for next month fetched successfully" && response.data) {
          this.all_audits = response.data.map(audit => this.mapPendingToDisplay(audit));
          this.filtered_list = [...this.all_audits];
        } else {
          console.error('Unexpected response format:', response);
          this.all_audits = [];
          this.filtered_list = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading next month pending clients:', error);
        
        // Load sample data for testing if API fails
        this.loadSampleData();
        
        this.cdr.detectChanges();
      }
    });
  }

  // Map API response to display format
  private mapPendingToDisplay(pending: AsvPendingResponse): ClientData {
    return {
      company: pending.associated_organization || 'N/A',
      assessment: pending.associated_application || 'N/A',
      Q1: this.formatStatus(pending.q1),
      Q2: this.formatStatus(pending.q2),
      Q3: this.formatStatus(pending.q3),
      Q4: this.formatStatus(pending.q4),
      status: this.formatStatus(pending.status),
      numberOfIP: pending.number_of_ip || 0,
      ips: pending.ip_details?.map(ip => ip.ip) || [],
      rawData: pending
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
    return 'pending';
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

  // Export to Excel
  exportToExcel(): void {
    if (this.filtered_list.length === 0) {
      console.warn('No data to export');
      alert('No data to export');
      return;
    }

    try {
      // Prepare data for export (excluding rawData and arrays)
      const exportData = this.filtered_list.map(item => ({
        'Company': item.company,
        'Assessment': item.assessment,
        'Q1 Status': item.Q1,
        'Q2 Status': item.Q2,
        'Q3 Status': item.Q3,
        'Q4 Status': item.Q4,
        'Overall Status': item.status,
        'Number of IPs': item.numberOfIP,
        'IP Addresses': item.ips.join(', ')
      }));

      const fileName = `Next-Month-Pending-Clients-${new Date().toISOString().split('T')[0]}.xlsx`;
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const wb: XLSX.WorkBook = {
        Sheets: { 'Next Month Pending Clients': ws },
        SheetNames: ['Next Month Pending Clients']
      };
      
      // Auto-size columns
      const wscols = [
        { wch: 30 }, // Company
        { wch: 40 }, // Assessment
        { wch: 15 }, // Q1 Status
        { wch: 15 }, // Q2 Status
        { wch: 15 }, // Q3 Status
        { wch: 15 }, // Q4 Status
        { wch: 15 }, // Overall Status
        { wch: 12 }, // Number of IPs
        { wch: 40 }, // IP Addresses
      ];
      ws['!cols'] = wscols;
      
      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    }
  }

  // Load sample data for testing
  private loadSampleData(): void {
    const sampleData: AsvPendingResponse[] = [
      {
        "asv_id": "c3f0a046-0b9e-4276-9ba0-6f75434b44d8",
        "number_of_ip": 1,
        "associated_organization": "Google",
        "associated_application": "ChatWithGoogle",
        "ip_details": [
          { "ip": "123.09.07.64" }
        ],
        "q1": "PENDING",
        "q2": "PENDING",
        "q3": "PENDING",
        "q4": "PENDING",
        "q1_pdf": null,
        "q2_pdf": null,
        "q3_pdf": null,
        "q4_pdf": null,
        "status": "INPROGRESS",
        "created_at": "2025-12-18T06:20:34.003Z",
        "updated_at": "2025-12-19T09:53:01.000Z"
      },
      {
        "asv_id": "649d47d5-2cae-4ca7-9b9d-ec0c26d642dc",
        "number_of_ip": 8,
        "associated_organization": "Google Gemini",
        "associated_application": "GoogleAI",
        "ip_details": [
          { "ip": "193.29.92.01" },
          { "ip": "123.12.12.12" }
        ],
        "q1": "PENDING",
        "q2": "PENDING",
        "q3": "PENDING",
        "q4": "PENDING",
        "q1_pdf": null,
        "q2_pdf": null,
        "q3_pdf": null,
        "q4_pdf": null,
        "status": "COMPLETED",
        "created_at": "2025-12-18T06:28:52.999Z",
        "updated_at": "2025-12-19T06:10:58.000Z"
      },
      {
        "asv_id": "7462b088-d195-460c-9a3d-6f0bff218a5b",
        "number_of_ip": 5,
        "associated_organization": "Bhutan National Bank Limited (BNBL)",
        "associated_application": "BNBL PCI",
        "ip_details": [
          { "ip": "192.168.1.1" },
          { "ip": "192.168.1.2" },
          { "ip": "192.168.1.3" },
          { "ip": "192.168.1.4" },
          { "ip": "192.168.1.5" }
        ],
        "q1": "PENDING",
        "q2": "PENDING",
        "q3": "PENDING",
        "q4": "PENDING",
        "q1_pdf": null,
        "q2_pdf": null,
        "q3_pdf": null,
        "q4_pdf": null,
        "status": "PENDING",
        "created_at": "2025-12-19T10:50:50.588Z",
        "updated_at": "2025-12-19T10:50:50.588Z"
      }
    ];

    this.all_audits = sampleData.map(audit => this.mapPendingToDisplay(audit));
    this.filtered_list = [...this.all_audits];
    this.isLoading = false;
  }

  // Refresh data
  refreshData(): void {
    this.loadNextMonthPendingClients();
  }
}