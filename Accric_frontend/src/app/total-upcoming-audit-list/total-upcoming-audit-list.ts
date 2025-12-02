import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface AuditRow {
  code: string;
  client: string;
  date: string;
}

@Component({
  selector: 'app-total-upcoming-audit-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './total-upcoming-audit-list.html',
  styleUrl: './total-upcoming-audit-list.css',
})



export class TotalUpcomingAuditList {
  search_text = '';
  audit_list: AuditRow[] = [
    { code: 'Intercert', client: 'RSM93923992', date: '2025-01-05' },
    { code: 'Microsoft', client: 'RSM93738828', date: '2025-01-12' },
    { code: 'Google', client: 'RSM9392999999', date: '2025-02-20' }
  ];

  filtered_list: AuditRow[] = [...this.audit_list];
  editingAudit: AuditRow | null = null;

  filter_list() {
    const text = this.search_text.toLowerCase();
    this.filtered_list = this.audit_list.filter(row =>
      row.code.toLowerCase().includes(text) ||
      row.client.toLowerCase().includes(text) ||
      row.date.toLowerCase().includes(text)
    );
  }

  viewDetails(row: AuditRow) {
    alert('Viewing: ' + JSON.stringify(row));
  }

  editAudit(row: AuditRow) {
    this.editingAudit = { ...row };
  }

  deleteAudit(row: AuditRow) {
    this.audit_list = this.audit_list.filter(a => a !== row);
    this.filter_list();
  }

  saveEdit() {
    if (this.editingAudit) {
      const index = this.audit_list.findIndex(a => a.code === this.editingAudit!.code);
      if (index !== -1) this.audit_list[index] = this.editingAudit;
      this.filter_list();
      this.editingAudit = null;
    }
  }

  cancelEdit() {
    this.editingAudit = null;
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.filtered_list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upcoming Audits');
    XLSX.writeFile(wb, 'upcoming-audits.xlsx');
  }
}
