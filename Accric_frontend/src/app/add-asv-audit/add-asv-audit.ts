import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface Client {
  id: string;
  clientId: string;
  legal_entity_name: string;
  trading_name?: string;
}

interface Audit {
  auditId: string;
  id: string;
  assessment_project_name: string;
  client: {
    clientId: string;
    legal_entity_name: string;
  };
}

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-add-asv-audit',
  templateUrl: './add-asv-audit.html',
  styleUrls: ['./add-asv-audit.css']
})
export class AddAsvAudit implements OnInit {

  legalEntitySearch = '';
  auditSearch = '';

  // Dropdown control
  showLegalEntityDropdown = false;
  showAuditDropdown = false;

  // Data lists
  clients: Client[] = [];
  allAudits: Audit[] = []; // Store all audits
  filteredAudits: Audit[] = []; // Store filtered audits based on selected client

  filteredClients: Client[] = [];

  selectedClientId: string | null = null;
  selectedAuditId: string | null = null;

  showErrors = false;
  isLoading = false;

  asvData = {
    numberOfIPs: null,
    associatedOrganization: '',
    associatedApplication: '',
    IPDetails: ''
  };

  // Search subjects for debouncing
  private clientSearchSubject = new Subject<string>();
  private auditSearchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load initial data from APIs
    this.loadClients();
    this.loadAudits();

    // Setup debounced search for clients
    this.clientSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterClients(searchTerm);
    });

    // Setup debounced search for audits
    this.auditSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterAudits(searchTerm);
    });
  }

  // API to load clients
  loadClients(): void {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/clients-for-audit';
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ data: Client[] }>(url, { headers }).subscribe({
      next: (response) => {  
        // Map the response to match Client interface
        this.clients = response.data.map(client => ({
          id: client.clientId || client.id,
          clientId: client.clientId || client.id,
          legal_entity_name: client.legal_entity_name,
          trading_name: client.trading_name
        }));
        
        console.log("Clients loaded:", this.clients);
        this.filteredClients = [...this.clients];
        this.isLoading = false;
        
        // Force UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
        this.isLoading = false;
        alert('Failed to load clients. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // API to load all audits
  loadAudits(): void {
    this.isLoading = true;
    const url = 'http://pci.accric.com/api/auth/audit-list';
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ data: Audit[] }>(url, { headers }).subscribe({
      next: (response) => {
        // Map the response to match Audit interface
        this.allAudits = response.data.map(audit => ({
          auditId: audit.auditId || audit.id,
          id: audit.auditId || audit.id,
          assessment_project_name: audit.assessment_project_name,
          client: audit.client || { clientId: '', legal_entity_name: '' }
        }));
        
        console.log("All audits loaded:", this.allAudits);
        
        // Initially show no audits until a client is selected
        this.filteredAudits = [];
        this.isLoading = false;
        
        // Force UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load audits:', error);
        this.isLoading = false;
        alert('Failed to load audit list. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // CLIENT SEARCH
  onLegalEntitySearch() {
    this.clientSearchSubject.next(this.legalEntitySearch);
  }

  filterClients(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredClients = [...this.clients];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.legal_entity_name.toLowerCase().includes(term) ||
        (client.trading_name && client.trading_name.toLowerCase().includes(term))
      );
    }
    
    // Force UI update for dropdown
    this.cdr.detectChanges();
  }

  onLegalEntityBlur() {
    setTimeout(() => {
      this.showLegalEntityDropdown = false;

      // Auto-select if search matches exactly
      if (!this.selectedClientId && this.legalEntitySearch) {
        const matchedClient = this.clients.find(client =>
          client.legal_entity_name.toLowerCase() === this.legalEntitySearch.toLowerCase() ||
          (client.trading_name && client.trading_name.toLowerCase() === this.legalEntitySearch.toLowerCase())
        );

        if (matchedClient) {
          this.selectClient(matchedClient);
        } else {
          // Clear if no match found
          this.legalEntitySearch = '';
          this.selectedClientId = null;
          // Also clear audits dropdown
          this.auditSearch = '';
          this.selectedAuditId = null;
          this.filteredAudits = [];
        }
      }
      
      // Force UI update
      this.cdr.detectChanges();
    }, 200);
  }

  selectClient(client: Client) {
    this.legalEntitySearch = client.legal_entity_name;
    this.selectedClientId = client.clientId;
    this.showLegalEntityDropdown = false;
    
    // Filter audits based on selected client
    this.filterAuditsByClient(client.clientId);
    
    // Clear audit selection when client changes
    this.auditSearch = '';
    this.selectedAuditId = null;
    
    // Force UI update
    this.cdr.detectChanges();
  }

  // Filter audits by client ID
  filterAuditsByClient(clientId: string): void {
    if (!clientId) {
      this.filteredAudits = [];
    } else {
      this.filteredAudits = this.allAudits.filter(audit => 
        audit.client && audit.client.clientId === clientId
      );
    }
    
    console.log(`Filtered audits for client ${clientId}:`, this.filteredAudits);
    
    // Force UI update
    this.cdr.detectChanges();
  }

  // AUDIT SEARCH
  onAuditSearch() {
    this.auditSearchSubject.next(this.auditSearch);
  }

  filterAudits(searchTerm: string): void {
    if (!searchTerm.trim()) {
      // If no search term, show all audits for the selected client
      if (this.selectedClientId) {
        this.filteredAudits = this.allAudits.filter(audit => 
          audit.client && audit.client.clientId === this.selectedClientId
        );
      } else {
        this.filteredAudits = [];
      }
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredAudits = this.allAudits.filter(audit => {
        // Only show audits for the selected client
        if (this.selectedClientId && (!audit.client || audit.client.clientId !== this.selectedClientId)) {
          return false;
        }
        
        return audit.assessment_project_name.toLowerCase().includes(term);
      });
    }
    
    // Force UI update for dropdown
    this.cdr.detectChanges();
  }

  onAuditBlur() {
    setTimeout(() => {
      this.showAuditDropdown = false;

      // Auto-select if search matches exactly
      if (!this.selectedAuditId && this.auditSearch && this.selectedClientId) {
        const matchedAudit = this.filteredAudits.find(audit =>
          audit.assessment_project_name.toLowerCase() === this.auditSearch.toLowerCase()
        );

        if (matchedAudit) {
          this.selectAudit(matchedAudit);
        } else {
          // Clear if no match found
          this.auditSearch = '';
          this.selectedAuditId = null;
        }
      }
      
      // Force UI update
      this.cdr.detectChanges();
    }, 200);
  }

  selectAudit(audit: Audit) {
    this.auditSearch = audit.assessment_project_name;
    this.selectedAuditId = audit.auditId;
    this.showAuditDropdown = false;
    
    // Force UI update
    this.cdr.detectChanges();
  }

  // IP COUNT
  getIPCountFromDetails(): number {
    if (!this.asvData.IPDetails) return 0;

    const ipRegex = /\b((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}\b/g;

    const matches = this.asvData.IPDetails.match(ipRegex);
    return matches ? matches.length : 0;
  }

  // SUBMIT
  onSubmit(form: NgForm) {
    this.showErrors = true;

    // Validate required fields
    if (!form.valid || !this.selectedClientId || !this.selectedAuditId) {
      if (!this.selectedClientId) {
        alert('Please select a client from the dropdown list.');
        return;
      }
      if (!this.selectedAuditId) {
        alert('Please select an audit from the dropdown list.');
        return;
      }
      return;
    }

    // Validate numberOfIPs
    if (!this.asvData.numberOfIPs || this.asvData.numberOfIPs < 1) {
      alert('Please enter a valid number of IPs (minimum 1).');
      return;
    }

    // Validate other required fields
    if (!this.asvData.associatedOrganization.trim()) {
      alert('Associated Organization is required.');
      return;
    }

    if (!this.asvData.associatedApplication.trim()) {
      alert('Associated Application is required.');
      return;
    }

    const payload = {
      ...this.asvData,
      clientId: this.selectedClientId,
      auditId: this.selectedAuditId
    };

    console.log('Submitting ASV Audit:', payload);
    
    // Here you would typically call an API to submit the data
    // For now, just show success message
    alert('Form Submitted Successfully!');
    
    // Optionally reset the form after successful submission
    // this.resetForm(form);
  }

  // Optional: Reset form after submission
  resetForm(form: NgForm): void {
    form.resetForm();
    this.legalEntitySearch = '';
    this.auditSearch = '';
    this.selectedClientId = null;
    this.selectedAuditId = null;
    this.showErrors = false;
    this.showLegalEntityDropdown = false;
    this.showAuditDropdown = false;
    
    this.asvData = {
      numberOfIPs: null,
      associatedOrganization: '',
      associatedApplication: '',
      IPDetails: ''
    };
    
    // Reset filtered lists
    this.filteredClients = [...this.clients];
    this.filteredAudits = [];
    
    // Force UI update
    this.cdr.detectChanges();
  }
}