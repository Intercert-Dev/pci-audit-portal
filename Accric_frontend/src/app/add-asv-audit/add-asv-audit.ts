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
  
  // Comprehensive IP and Domain Validation Patterns
  private readonly ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  private readonly ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:|^:(?:[0-9a-fA-F]{1,4}:){1,7}|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;
  private readonly ipv4WithPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?$/;
  private readonly ipv6WithPortRegex = /^\[(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\](?::\d{1,5})?$|^\[(?:[0-9a-fA-F]{1,4}:){1,7}:](?::\d{1,5})?$|^:(?::\d{1,5})?/;
  
  // Flexible Domain Regex - allows any valid domain format
  private readonly domainRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/\S*)?$/;
  
  // Simple domain pattern for basic validation (no protocol, no path)
  private readonly simpleDomainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  
  // Allow hostnames (for internal networks)
  private readonly hostnameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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

  /**
   * Comprehensive validation for all types of IP addresses and domains
   */
  validateEntry(entry: string): { isValid: boolean; type: 'ipv4' | 'ipv6' | 'domain' | 'hostname' | 'invalid' } {
    const cleanedEntry = entry.trim();
    
    // Check for IPv4
    if (this.ipv4Regex.test(cleanedEntry)) {
      return { isValid: true, type: 'ipv4' };
    }
    
    // Check for IPv4 with port
    if (this.ipv4WithPortRegex.test(cleanedEntry)) {
      return { isValid: true, type: 'ipv4' };
    }
    
    // Check for IPv6
    if (this.ipv6Regex.test(cleanedEntry)) {
      return { isValid: true, type: 'ipv6' };
    }
    
    // Check for IPv6 with port
    if (this.ipv6WithPortRegex.test(cleanedEntry)) {
      return { isValid: true, type: 'ipv6' };
    }
    
    // Check for domain with protocol and path (full URL)
    if (this.domainRegex.test(cleanedEntry)) {
      return { isValid: true, type: 'domain' };
    }
    
    // Check for simple domain (no protocol)
    if (this.simpleDomainRegex.test(cleanedEntry)) {
      return { isValid: true, type: 'domain' };
    }
    
    // Check for hostname (for internal networks)
    if (this.hostnameRegex.test(cleanedEntry) && cleanedEntry.includes('.')) {
      return { isValid: true, type: 'hostname' };
    }
    
    // Check if it's just a single word hostname (for local/internal)
    if (this.hostnameRegex.test(cleanedEntry)) {
      return { isValid: true, type: 'hostname' };
    }
    
    return { isValid: false, type: 'invalid' };
  }

  /**
   * Get all valid entries with their types
   */
  getValidEntries() {
    if (!this.asvData.IPDetails || !this.asvData.IPDetails.trim()) {
      return { 
        ips: 0, 
        domains: 0, 
        total: 0, 
        invalidCount: 0, 
        hasInvalid: false,
        entries: []
      };
    }

    // Split by comma, space, newline, semicolon, or tab
    const entries = this.asvData.IPDetails
      .split(/[,\s\n;]+/)
      .map(e => e.trim())
      .filter(e => e !== '');

    const results = entries.map(entry => this.validateEntry(entry));
    
    const ips = results.filter(r => r.type === 'ipv4' || r.type === 'ipv6').length;
    const domains = results.filter(r => r.type === 'domain' || r.type === 'hostname').length;
    const invalidCount = results.filter(r => r.type === 'invalid').length;

    return {
      ips,
      domains,
      total: ips + domains,
      invalidCount,
      hasInvalid: invalidCount > 0,
      entries: results,
      rawEntries: entries
    };
  }

  /**
   * Check if there are any invalid entries
   */
  hasInvalidEntries(): boolean {
    return this.getValidEntries().hasInvalid;
  }

  /**
   * Get all IP addresses (IPv4 and IPv6)
   */
  getValidIPs(): string[] {
    if (!this.asvData.IPDetails) return [];
    
    const entries = this.asvData.IPDetails
      .split(/[,\s\n;]+/)
      .map(e => e.trim())
      .filter(e => e !== '');
    
    return entries.filter(entry => {
      const validation = this.validateEntry(entry);
      return validation.type === 'ipv4' || validation.type === 'ipv6';
    });
  }

  /**
   * Get all domains and hostnames
   */
  getValidDomains(): string[] {
    if (!this.asvData.IPDetails) return [];
    
    const entries = this.asvData.IPDetails
      .split(/[,\s\n;]+/)
      .map(e => e.trim())
      .filter(e => e !== '');
    
    return entries.filter(entry => {
      const validation = this.validateEntry(entry);
      return validation.type === 'domain' || validation.type === 'hostname';
    });
  }

  /**
   * Get IP details array for API payload
   */
  getIpDetailsArray(): IpDetail[] {
    const validIPs = this.getValidIPs();
    return validIPs.map(ip => ({ ip }));
  }

  /**
   * Get IP count from details (only IPs, not domains)
   */
  getIPCountFromDetails(): number {
    return this.getValidIPs().length;
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

  onSubmit(form: NgForm) {
    this.showErrors = true;

    // Get validation results
    const validation = this.getValidEntries();
    
    console.log('Validation results:', validation); // For debugging

    if (
      form.invalid ||
      !this.selectedClientId ||
      !this.selectedAuditId ||
      validation.hasInvalid ||
      validation.total === 0
    ) {
      if (validation.hasInvalid) {
        this.toast.error(`Please check your entries. Found ${validation.invalidCount} invalid entry(ies).`);
      } else if (validation.total === 0) {
        this.toast.error('Please enter at least one valid IP address or domain.');
      } else {
        this.toast.error('Please fill all required fields correctly.');
      }
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
      number_of_ip: ipCount,
      associated_organization: this.asvData.associatedOrganization,
      associated_application: this.asvData.associatedApplication,
      ip_details: this.getIpDetailsArray(),
      q1: "PENDING",
      q2: "PENDING",
      status: "PENDING"
    };

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

  // Helper method to show what was detected
  getDetectionMessage(): string {
    const validation = this.getValidEntries();
    if (validation.total === 0) return '';
    
    const ipTypes = validation.entries.filter(e => e.type === 'ipv4' || e.type === 'ipv6');
    const ipv4Count = ipTypes.filter(e => e.type === 'ipv4').length;
    const ipv6Count = ipTypes.filter(e => e.type === 'ipv6').length;
    const domainCount = validation.entries.filter(e => e.type === 'domain').length;
    const hostnameCount = validation.entries.filter(e => e.type === 'hostname').length;
    
    const parts = [];
    if (ipv4Count > 0) parts.push(`${ipv4Count} IPv4`);
    if (ipv6Count > 0) parts.push(`${ipv6Count} IPv6`);
    if (domainCount > 0) parts.push(`${domainCount} Domain${domainCount > 1 ? 's' : ''}`);
    if (hostnameCount > 0) parts.push(`${hostnameCount} Hostname${hostnameCount > 1 ? 's' : ''}`);
    
    return `Detected: ${parts.join(', ')}`;
  }
}