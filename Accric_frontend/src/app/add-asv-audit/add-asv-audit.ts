import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ToastService } from '../service/toast-service';

interface Client {
  id: string;
  clientId: string;
  legal_entity_name: string;
  trading_name?: string;
}

interface AsvFormData {
  numberOfIPs: number | null;
  associatedOrganization: string;
  associatedApplication: string;
  IPDetails: string;
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

interface IpDetail {
  ip: string;
}

interface AsvAuditPayload {
  client: string;
  audit: string;
  number_of_ip: number;
  associated_organization: string;
  associated_application: string;
  ip_details: IpDetail[];
  q1: string;
  q2: string;
  status: string;
}

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-add-asv-audit',
  templateUrl: './add-asv-audit.html',
  styleUrls: ['./add-asv-audit.css']
})
export class AddAsvAudit implements OnInit {

  private readonly ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  private readonly domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}$/;
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
  isSubmitting = false;

  asvData: AsvFormData = {
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
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) { }

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
    const url = 'https://pci.accric.com/api/auth/clients-for-audit';
    const token = localStorage.getItem('jwt');

    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
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
        this.filteredClients = [...this.clients];
        this.isLoading = false;

        // Force UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.toast.error('Failed to load clients. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // API to load all audits
  loadAudits(): void {
    this.isLoading = true;
    const url = 'https://pci.accric.com/api/auth/audit-list';
    const token = localStorage.getItem('jwt');

    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
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

        // Initially show no audits until a client is selected
        this.filteredAudits = [];
        this.isLoading = false;

        // Force UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.toast.error('Failed to load audit list. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  getValidEntries() {
    if (!this.asvData.IPDetails) return { ips: 0, domains: 0, total: 0, invalidCount: 0 };

    // Split by comma or newline, then trim whitespace
    const entries = this.asvData.IPDetails.split(/[,\n]/).map(e => e.trim()).filter(e => e !== '');

    let ips = 0;
    let domains = 0;

    entries.forEach(entry => {
      if (this.ipRegex.test(entry)) {
        ips++;
      } else if (this.domainRegex.test(entry)) {
        domains++;
      }
    });

    return {
      ips,
      domains,
      total: ips + domains,
      invalidCount: entries.length - (ips + domains),
      hasInvalid: (entries.length - (ips + domains)) > 0
    };
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
    this.asvData.associatedOrganization = client.legal_entity_name;
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

  getValidIPs(): string[] {
    if (!this.asvData.IPDetails) return [];

    return this.asvData.IPDetails
      .split(/[\s,]+/) // split by comma, space, newline
      .map(ip => ip.trim())
      .filter(ip => this.ipRegex.test(ip));
  }

  getIpDetailsArray(): IpDetail[] {
    const validIPs = this.getValidIPs();
    return validIPs.map(ip => ({ ip }));
  }

  hasInvalidIPs(): boolean {
    if (!this.asvData.IPDetails) return true;

    const ips = this.asvData.IPDetails
      .split(/[\s,]+/)
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);

    return ips.some(ip => !this.ipRegex.test(ip));
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
    this.asvData.associatedApplication = audit.assessment_project_name;
    this.selectedAuditId = audit.auditId;
    this.showAuditDropdown = false;

    // Force UI update
    this.cdr.detectChanges();
  }

  getIPCountFromDetails(): number {
    return this.getValidIPs().length;
  }

  onSubmit(form: NgForm) {
    this.showErrors = true;

    if (
      form.invalid ||
      !this.selectedClientId ||
      !this.selectedAuditId ||
      this.hasInvalidIPs()
    ) {
      this.toast.error('Please fill all required fields correctly.');
      return;
    }

    // Get the number of IPs from the details
    const ipCount = this.getIPCountFromDetails();
    if (ipCount === 0) {
      this.toast.error('Please enter at least one valid IP address.');
      return;
    }

    // Prepare payload with exact API format
    const payload: AsvAuditPayload = {
      client: this.selectedClientId,
      audit: this.selectedAuditId,
      number_of_ip: ipCount, // Changed from numberOfIPs to number_of_ip
      associated_organization: this.asvData.associatedOrganization,
      associated_application: this.asvData.associatedApplication,
      ip_details: this.getIpDetailsArray(), // Changed from IPDetails to ip_details array
      q1: "PENDING",
      q2: "PENDING",
      status: "PENDING"
    };

    // Log payload for debugging
    console.log('Submitting payload:', payload);

    // Call the submit function
    this.submitAsvAudit(payload, form);
  }

  submitAsvAudit(payload: AsvAuditPayload, form: NgForm): void {
    this.isSubmitting = true;

    const url = 'https://pci.accric.com/api/auth/add-asv-audit-to-client';
    const token = localStorage.getItem('jwt');

    if (!token) {
      this.toast.error('Please login first. No authentication token found.');
      this.isSubmitting = false;
      this.cdr.detectChanges();
      return;
    }

    // Prepare headers with JWT token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    // Make POST request
    this.http.post<any>(url, payload, { headers }).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        // Check response structure based on your API
        if (response.success || response.message) {
          this.toast.success(response.message || 'ASV Audit added successfully!');

          // Reset form after successful submission
          this.resetForm(form);
        } else {
          this.toast.success('ASV Audit added successfully!');
          this.resetForm(form);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSubmitting = false;

        // Log error for debugging
        console.error('Error submitting ASV Audit:', error);

        // Handle different error scenarios
        if (error.status === 401) {
          this.toast.error('Session expired. Please login again.');
        } else if (error.status === 400) {
          // Show the detailed error message from API
          const errorMessage = error.error?.message || 'Invalid data. Please check your inputs.';
          this.toast.error(errorMessage);
        } else if (error.status === 409) {
          this.toast.error(error.error?.message || 'ASV Audit already exists for this client.');
        } else if (error.status === 404) {
          this.toast.error('Resource not found. Please check the endpoint.');
        } else if (error.status === 500) {
          this.toast.error('Server error. Please try again later.');
        } else {
          this.toast.error(error.error?.message || 'Failed to add ASV Audit. Please try again.');
        }

        this.cdr.detectChanges();
      }
    });
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


  resetAsvAuditForm(form: NgForm): void {

    this.asvData = {
      numberOfIPs: null,
      associatedOrganization: '',
      associatedApplication: '',
      IPDetails: ''
    };

    this.legalEntitySearch = '';
    this.auditSearch = '';

    this.selectedClientId = '';
    this.selectedAuditId = '';

    this.showLegalEntityDropdown = false;
    this.showAuditDropdown = false;

    this.showErrors = false;

    this.filteredClients = [...this.clients];
    this.filteredAudits = [];

    form.resetForm();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}