import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';


interface Client {
  company: string;
  certNo: string;
  client_status?:string;
}

@Component({
  selector: 'app-suspended-client-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './suspended-client-list.html',
  styleUrl: './suspended-client-list.css',
})

export class SuspendedClientList implements OnInit {
  search_text: string = "";
  editingClient: Client | null = null;
  clientList: Client[] = [];
  filtered_list: Client[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const url = 'http://pci.accric.com/api/auth/suspended-clients';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        console.log("Raw API Data:", res.data);

        this.clientList = res.data.map((item: any) => ({
          company: item.legal_entity_name || '',
          certNo: item.certificate_number_unique_id || '',
          client_status:item.client_status || '',
        }));

        this.filtered_list = [...this.clientList];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch client list:', err);
      }
    });
  }

  filter_list() {
    const search = this.search_text.toLowerCase();
    this.filtered_list = this.clientList.filter((item: Client) =>
      item.company?.toLowerCase().includes(search) ||
      item.certNo?.toLowerCase().includes(search) ||
      item.client_status?.toLowerCase().includes(search)
    );
  }

  exportToExcel() {
    const fileName = 'Client-Certificates.xlsx';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filtered_list.map(client => ({
      'Company': client.company,
      'Cert No': client.certNo,
      'Status': client.client_status,
    })));
    const wb: XLSX.WorkBook = { Sheets: { 'Certificates': ws }, SheetNames: ['Certificates'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }
}

