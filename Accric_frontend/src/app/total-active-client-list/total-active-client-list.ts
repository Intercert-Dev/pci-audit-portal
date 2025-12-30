import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Client {
  clientId: string;
  legal_entity_name: string;
  trading_name: string;
  county_name: string;
  state_name: string;
  city_name: string;
  street_name: string;
  zip_name: string;
  nature_of_business: string | null;
  website_domain_url: string | null;
  type_of_business: string;
  contact_name: string;
  designation: string;
  contact_email: string;
  phone: string;
  technical_contacts: string | null;
  information_security_officer: string | null;
  client_signoff_authority: string;
  client_status: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-total-active-client-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './total-active-client-list.html',
  styleUrls: ['./total-active-client-list.css']
})
export class TotalActiveClientList implements OnInit {

  search_text: string = '';
  clientList: Client[] = [];
  filtered_list: Client[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const url = 'https://pci.accric.com/api/auth/client-list';
    const token = localStorage.getItem("jwt");

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ data: Client[] }>(url, { headers }).subscribe({
      next: (res) => {

        // Step 1: Map original data
        let list = res.data.map((item: Client) => ({
          ...item
        }));

        // Step 2: Filter ONLY ACTIVE clients
        this.clientList = list.filter(
          (client: Client) => client.client_status === "ACTIVE"
        );

        // Step 3: Assign for UI
        this.filtered_list = [...this.clientList];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch active clients:", err);
      }
    });
  }

  filter_list() {
    const search = this.search_text.toLowerCase().trim();
    this.filtered_list = this.clientList.filter((client: Client) =>
      client.legal_entity_name.toLowerCase().includes(search) ||
      client.contact_name.toLowerCase().includes(search) ||
      client.contact_email.toLowerCase().includes(search) ||
      client.phone.toLowerCase().includes(search)
    );
  }

  exportToExcel() {
    const fileName = 'Active-Clients.xlsx';
    const excelData = this.filtered_list.map(client => ({
      'Company': client.legal_entity_name,
      'Contact Name': client.contact_name,
      'Email': client.contact_email,
      'Phone': client.phone,
      'Country': client.county_name,
      'Status': client.client_status,
      'Created Date': client.created_at
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const wb: XLSX.WorkBook = { Sheets: { 'Active Clients': ws }, SheetNames: ['Active Clients'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    saveAs(new Blob([excelBuffer]), fileName);
  }
}
