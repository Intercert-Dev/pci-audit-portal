import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';  // <-- Import for fast table

@Component({
  selector: 'app-suspended-client-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    ScrollingModule  // <-- Add here
  ],
  templateUrl: './suspended-client-list.html',
  styleUrls: ['./suspended-client-list.css']
})
export class SuspendedClientList implements OnInit {
  search_text: string = "";
  clientList: any[] = [];
  filtered_list: any[] = [];
  
  editingClient: any = null;
  isLoading: boolean = true;  // <-- For loading indicator
  
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef  // <-- For fast UI update
  ) {}

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    this.isLoading = true; 
    
    const url = 'https://pci.accric.com/api/auth/suspended-clients';
    const token = localStorage.getItem("jwt");

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        console.log("res data in sus ",res.data);
        
        this.clientList = res.data.map((item: any) => ({
          company: item.legal_entity_name || 'N/A',
          contact_name: item.contact_name || 'N/A',
          contact_email: item.contact_email || 'N/A',
          phone: item.phone || 'N/A',
          county_name: item.county_name || 'N/A',
          client_status: item.client_status || 'SUSPENDED',
          created_at: item.created_at || null,

          // All popup fields
          legal_entity_name: item.legal_entity_name || '',
          trading_name: item.trading_name || '',
          state_name: item.state_name || '',
          city_name: item.city_name || '',
          street_name: item.street_name || '',
          zip_name: item.zip_name || '',
          nature_of_business: item.nature_of_business || '',
          website_domain_url: item.website_domain_url || '',
          type_of_business: item.type_of_business || '',
          designation: item.designation || '',
          technical_contacts: item.technical_contacts || '',
          information_security_officer: item.information_security_officer || '',
          client_signoff_authority: item.client_signoff_authority || '',
        }));

        this.filtered_list = [...this.clientList];
        this.isLoading = false;  // <-- Hide loading
        this.cdr.detectChanges();  // <-- Force UI update
      },
      error: () => {
        console.error("Failed to fetch suspended clients");
        this.isLoading = false;
      }
    });
  }

  // ======================================
  // ▶ FILTER / SEARCH
  // ======================================
  filter_list() {
    const search = this.search_text.toLowerCase();

    this.filtered_list = this.clientList.filter(item =>
      item.company.toLowerCase().includes(search) ||
      item.contact_name.toLowerCase().includes(search) ||
      item.contact_email.toLowerCase().includes(search) ||
      item.phone.toLowerCase().includes(search) ||
      item.county_name.toLowerCase().includes(search) ||
      item.client_status.toLowerCase().includes(search)
    );
    
    this.cdr.detectChanges();  // <-- Fast update after filter
  }

  



  exportToExcel() {
    const fileName = 'Suspended-Clients.xlsx';

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.filtered_list.map(client => ({
        'Company Name': client.company,
        'Contact Name': client.contact_name,
        'Email': client.contact_email,
        'Phone': client.phone,
        'Country': client.county_name,
        'Status': client.client_status,
        'Created Date': client.created_at,
      }))
    );

    const wb: XLSX.WorkBook = {
      Sheets: { 'Suspended Clients': ws },
      SheetNames: ['Suspended Clients']
    };

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), fileName);
  }

}