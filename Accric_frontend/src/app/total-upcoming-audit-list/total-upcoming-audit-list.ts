import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface AuditRow {
  // matches API fields you provided earlier
  certificate_number_unique_id?: string;
  legal_entity_name?: string;
  audit_start_date?: string; // ISO date string
  // you can add more fields from the API if needed
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
  ) {}

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
    const url = "http://pci.accric.com/api/auth/login-response";

    const headers = new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {
        // Keep defensive: if API returns object, check key
        this.upcomingAudits = Array.isArray(res.activeOldCertificates)
          ? res.activeOldCertificates
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

  /** Search Filter */
  filter_list() {
    const text = (this.search_text || '').toLowerCase().trim();

    if (!text) {
      this.filtered_list = [...this.upcomingAudits];
      return;
    }

    this.filtered_list = this.upcomingAudits.filter(row =>
      (row.legal_entity_name || '').toLowerCase().includes(text) ||
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
    // map to friendly column headers if desired
    const exportData = this.filtered_list.map(item => ({
      Company: item.legal_entity_name || '',
      CertificateNumber: item.certificate_number_unique_id || '',
      AuditDate: item.audit_start_date || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upcoming Audits');
    XLSX.writeFile(wb, 'upcoming-audits.xlsx');
  }
}
