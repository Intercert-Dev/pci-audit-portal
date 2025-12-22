import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../service/toast-service';

interface Client {
  // Client Profile Fields (from API)
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
  
  // Primary Contacts Fields (from API)
  contact_name: string;
  designation: string;
  contact_email: string;
  phone: string;
  technical_contacts: string | null;
  information_security_officer: string | null;
  client_signoff_authority: string;
  client_status: string;
  
  // Timestamps (from API)
  created_at: string;
  updated_at: string;
  
  // For table display compatibility (optional)
  company?: string;
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.html',
  styleUrls: ['./client-list.css']
})
export class ClientList implements OnInit {
  search_text: string = "";
  editingClient: Client | null = null;
  clientList: Client[] = [];
  filtered_list: Client[] = [];
  isLoading: boolean = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,
    private toast:ToastService
  ) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/client-list';
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{data: Client[]}>(url, { headers }).subscribe({
      next: (res) => {

        this.clientList = res.data.map((item: Client) => ({
          ...item,
          // Add display fields for table compatibility
          company: item.legal_entity_name
        }));

        this.filtered_list = [...this.clientList];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch client list:', err);
        this.isLoading = false;
        this.toast.error('Failed to load clients. Please try again.');
      }
    });
  }

  filter_list() {
    const search = this.search_text.toLowerCase().trim();
    
    if (!search) {
      this.filtered_list = [...this.clientList];
      return;
    }
    
    this.filtered_list = this.clientList.filter((client: Client) =>
      client.legal_entity_name?.toLowerCase().includes(search) ||
      client.trading_name?.toLowerCase().includes(search) ||
      client.contact_name?.toLowerCase().includes(search) ||
      client.contact_email?.toLowerCase().includes(search) ||
      client.phone?.toLowerCase().includes(search) ||
      client.county_name?.toLowerCase().includes(search) ||
      client.state_name?.toLowerCase().includes(search) ||
      client.city_name?.toLowerCase().includes(search) ||
      client.client_status?.toLowerCase().includes(search) ||
      client.clientId?.toLowerCase().includes(search)
    );
  }

  exportToExcel() {
    const fileName = 'Clients-List.xlsx';
    
    // Prepare data for Excel export
    const excelData = this.filtered_list.map(client => ({
      'Client ID': client.clientId,
      'Legal Entity Name': client.legal_entity_name,
      'Trading Name': client.trading_name,
      'Contact Name': client.contact_name,
      'Email': client.contact_email,
      'Phone': client.phone,
      'Country': client.county_name,
      'State': client.state_name,
      'City': client.city_name,
      'Status': client.client_status,
      'Created Date': this.formatDate(client.created_at),
      'Designation': client.designation,
      'Type of Business': client.type_of_business
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const wb: XLSX.WorkBook = { 
      Sheets: { 'Clients': ws }, 
      SheetNames: ['Clients'] 
    };
    
    // Auto-size columns
    const wscols = [
      { wch: 15 }, // Client ID
      { wch: 25 }, // Legal Entity Name
      { wch: 20 }, // Trading Name
      { wch: 20 }, // Contact Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Country
      { wch: 15 }, // State
      { wch: 15 }, // City
      { wch: 10 }, // Status
      { wch: 15 }, // Created Date
      { wch: 15 }, // Designation
      { wch: 20 }  // Type of Business
    ];
    ws['!cols'] = wscols;
    
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  editClient(client: Client) {
    this.editingClient = JSON.parse(JSON.stringify(client));
  }

  saveClient() {
    if (!this.editingClient) return;

    this.isLoading = true;
    
    // Construct the URL with clientId in the path
    const url = `http://pci.accric.com/api/auth/update-client/${this.editingClient.clientId}`;
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      this.toast.warning('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Prepare update payload (EXACTLY as your API expects)
    const updatePayload = {
      legal_entity_name: this.editingClient.legal_entity_name || '',
      trading_name: this.editingClient.trading_name || '',
      county_name: this.editingClient.county_name || '',
      state_name: this.editingClient.state_name || '',
      city_name: this.editingClient.city_name || '',
      street_name: this.editingClient.street_name || '',
      zip_name: this.editingClient.zip_name || '',
      nature_of_business: this.editingClient.nature_of_business || '',
      website_domain_url: this.editingClient.website_domain_url || '',
      type_of_business: this.editingClient.type_of_business || '',
      contact_name: this.editingClient.contact_name || '',
      designation: this.editingClient.designation || '',
      contact_email: this.editingClient.contact_email || '',
      phone: this.editingClient.phone || '',
      technical_contacts: this.editingClient.technical_contacts || '',
      information_security_officer: this.editingClient.information_security_officer || '',
      client_signoff_authority: this.editingClient.client_signoff_authority || '',
      client_status: this.editingClient.client_status || 'ACTIVE'
    };

    console.log('Sending PUT request to:', url);
    console.log('Update payload:', updatePayload);

    this.http.put(url, updatePayload, { headers }).subscribe({
      next: (res: any) => {
        console.log('Client updated successfully:', res);
        
        // Update the client in local list
        const index = this.clientList.findIndex(client => client.clientId === this.editingClient!.clientId);
        if (index !== -1) {
          // Update all fields from editingClient
          this.clientList[index] = { ...this.editingClient! };
          // Ensure company display name is updated
          this.clientList[index].company = this.editingClient!.legal_entity_name;
          
          // Update filtered list
          this.filtered_list = [...this.clientList];
        }
        
        this.cancelEdit();
        this.isLoading = false;
        this.toast.success('Client updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update client:', err);
        
        let errorMessage = 'Failed to update client. ';
        if (err.status === 401) {
          errorMessage += 'Unauthorized. Please check your authentication token.';
        } else if (err.status === 400) {
          errorMessage += 'Bad request. Please check the data you entered.';
        } else if (err.status === 404) {
          errorMessage += 'Client not found.';
        } else if (err.error && err.error.message) {
          errorMessage += err.error.message;
        }
        
        this.isLoading = false;
        this.toast.error(errorMessage || 'Something went wrong');
      }
    });
  }

  cancelEdit() {
    this.editingClient = null;
  }

  deleteClient(client: Client) {
    if (!confirm(`Are you sure you want to delete "${client.legal_entity_name}"?`)) {
      return;
    }

    this.isLoading = true;
    const url = `http://pci.accric.com/api/auth/delete-client/${client.clientId}`;
    const token = localStorage.getItem("jwt");
    
    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(url, { headers }).subscribe({
      next: (res: any) => {
        console.log('Client deleted:', res);
        
        // Remove client from local list
        this.clientList = this.clientList.filter(item => item.clientId !== client.clientId);
        this.filtered_list = this.filtered_list.filter(item => item.clientId !== client.clientId);
        
        this.isLoading = false;
        this.toast.success('Client deleted successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete client:', err);
        this.isLoading = false;
        
        let errorMessage = 'Failed to delete client. ';
        if (err.status === 401) {
          errorMessage += 'Unauthorized. Please check your authentication token.';
        } else if (err.status === 404) {
          errorMessage += 'Client not found.';
        }
        
        this.toast.error(errorMessage || 'Something went wrong');
      }
    });
  }
  deleteRow(row: Client) {
    this.deleteClient(row);
  }
}