import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface AuditRow {
  certificate_number_unique_id?: string;
  audit_start_date?: string;
  audit_end_date?: string;
  // The API puts the name inside this object
  client?: {
    legal_entity_name?: string;
    clientId?: string;
  };
}
@Component({
  selector: 'app-total-upcoming-audit-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './total-upcoming-audit-list.html',
  styleUrls: ['./total-upcoming-audit-list.css']
})
export class TotalUpcomingAuditList implements OnInit {

  search_text = '';
  upcomingAudits: AuditRow[] = [];
  filtered_list: AuditRow[] = [];

  editingAudit: AuditRow | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('jwt'); // ensure same key as where token is stored
    if (token) {
      this.fetchTotalUpcomingAudits(token);
    } else {
      alert("You can't access Total Upcoming Audit List without a Token");
      console.log("Token not found");
    }
  }

  /** Fetch Data */
  fetchTotalUpcomingAudits(token: string): void {
    const url = "https://pci.accric.com/api/auth/upcoming-expiry-clients";

    const headers = new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {

        this.upcomingAudits = Array.isArray(res.data)
          ? res.data
          : [];

        // Initialize filtered list
        this.filtered_list = [...this.upcomingAudits];

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch total upcoming audits...", err);
        this.cdr.detectChanges();
      }
    });
  }

  filter_list() {
    const text = (this.search_text || '').toLowerCase().trim();

    if (!text) {
      this.filtered_list = [...this.upcomingAudits];
      return;
    }

    this.filtered_list = this.upcomingAudits.filter(row =>
      // Search inside the nested client object
      (row.client?.legal_entity_name || '').toLowerCase().includes(text) ||
      (row.certificate_number_unique_id || '').toLowerCase().includes(text) ||
      (row.audit_start_date || '').toLowerCase().includes(text)
    );
  }
  /** View Details */
  viewDetails(row: AuditRow) {
    // implement navigation or modal as needed. For now, show alert
    alert('Viewing: ' + JSON.stringify(row, null, 2));
  }


  /** Export to Excel */
  exportToExcel() {
    const exportData = this.filtered_list.map(item => ({
      // Access nested property for Excel export
      Company: item.client?.legal_entity_name || 'N/A',
      CertificateNumber: item.certificate_number_unique_id || 'N/A',
      AuditStartDate: item.audit_start_date || 'N/A',
      AuditEndDate: item.audit_end_date || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upcoming Audits');
    XLSX.writeFile(wb, 'upcoming-audits.xlsx');
  }
}
