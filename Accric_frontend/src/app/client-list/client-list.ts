import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-list.html',
  styleUrls: ['./client-list.css'],
})
export class ClientList implements OnInit {

  serarch_text: string = "";
  filtered_list: any[] = [];
  editingRow: any = null;
  clientList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const url = 'http://pci.accric.com/api/auth/client-list';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (res) => {
        this.clientList = res;
        console.log("client list data",this.clientList);
        
        this.filtered_list = [...this.clientList];
        
      },
      error: (err) => {
        console.error('Failed to fetch client list:', err);
        alert('Failed to load client list. Check console for details.');
      }
    });
  }

  filter_list() {
    const search = this.serarch_text.toLowerCase();
    this.filtered_list = this.clientList.filter(
      item =>
        item.company?.toLowerCase().includes(search) ||
        item.certNo?.toLowerCase().includes(search) ||
        item.standard?.toLowerCase().includes(search) ||
        item.issueDate?.toLowerCase().includes(search) ||
        item.validDate?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search)
    );
  }

  exportToExcel() {
    const fileName = 'Client-Certificates.xlsx';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filtered_list);
    const wb: XLSX.WorkBook = { Sheets: { 'Certificates': ws }, SheetNames: ['Certificates'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  editRow(row: any) {
    this.editingRow = { ...row };
  }

  saveEdit() {
    const index = this.clientList.findIndex(item => item.certNo === this.editingRow.certNo);
    if (index !== -1) this.clientList[index] = { ...this.editingRow };
    this.filter_list();
    this.editingRow = null;
  }

  cancelEdit() {
    this.editingRow = null;
  }

  deleteRow(row: any) {
    if (!confirm("Are you sure you want to delete this row?")) return;
    this.clientList = this.clientList.filter(item => item !== row);
    this.filter_list();
  }
}
