import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Client {
  id: string;
  name: string;
  legal_entity_name: string;
}

interface Audit {
  id: string;
  name: string;
}

interface IPDetail {
  ip: string;
}

// Define the expected API response structure
interface AuditApiResponse {
  assessment_category?: string;
  assessment_period_covered?: string;
  assessment_project_name?: string;
  assessment_type?: string;
  assessment_year?: string;
  auditId: string;
  audit_end_date?: string;
  audit_manager_reviewer_name?: string;
  audit_start_date?: string;
  audit_status?: string;
  certificate_expiry_date?: string;
  certificate_issue_date?: string;
  certificate_number_unique_id?: string;
  classification?: string;
  client?: any;
  created_at?: string;
  date_of_report_submission?: string;
  location_of_scope?: string;
  name_of_qsa?: string;
  next_audit_due_date?: string;
  pci_dss_version_application?: string;
  qsa_license_certificate_number?: string;
  scope_of_assessment?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-add-asv-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-asv-audit.html',
  styleUrl: './add-asv-audit.css',
})
export class AddAsvAudit implements OnInit {
  showErrors = false;
  isLoading = false;
  isSubmitting = false;

  // Main form data
  asvData = {
    numberOfIPs: null as number | null,
    IPDetails: '',
    associatedOrganization: '',
    associatedApplication: '',
    legalEntityName: '',
    audit: '',
  };

  // For IP parsing
  ipArray: IPDetail[] = [];

  // Legal entity (client) search properties
  legalEntitySearch: string = '';
  showLegalEntityDropdown: boolean = false;
  selectedClientId: string | null = null;

  // Audit search properties
  auditSearch: string = '';
  showAuditDropdown: boolean = false;
  selectedAuditId: string | null = null;

  // API data arrays
  clients: Client[] = [];
  auditEntities: Audit[] = [];

  // Filtered arrays for dropdowns
  filteredClients: Client[] = [];
  filteredAudits: Audit[] = [];

  // API endpoints
  private readonly CLIENTS_API = 'http://pci.accric.com/api/auth/clients-for-audit';
  private readonly AUDITS_API = 'http://pci.accric.com/api/auth/audit-list';
  private readonly ADD_ASV_AUDIT_API = 'http://pci.accric.com/api/auth/add-asv-audit-to-client';

  constructor(private http: HttpClient) {
    console.log('Component constructor called');
    console.log('Current JWT token:', this.getAuthToken() ? 'Present' : 'Missing');
  }

  ngOnInit() {
    console.log('ngOnInit called - starting to load data');
    // Initialize by fetching data
    this.loadClients();
    this.loadAudits();
  }

  // Get JWT token from storage (adjust based on your auth setup)
  private getAuthToken(): string | null {
    const token = localStorage.getItem('jwt');
    console.log('Getting JWT token from localStorage:', token ? 'Token found' : 'No token found');
    return token;
  }

  // Create HTTP headers with Authorization token
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (token) {
      console.log('Creating headers with Authorization Bearer token');
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
      });
    } else {
      console.log('Creating headers WITHOUT Authorization token');
      return new HttpHeaders();
    }
  }

  // Check if user is authenticated
  private checkAuthentication(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      console.error('Authentication failed: No JWT token found');
      alert('You are not authenticated. Please log in first.');
      return false;
    }
    console.log('Authentication successful: JWT token found');
    return true;
  }

  // Load clients from API
  loadClients() {
    console.log('=== START loadClients() ===');
    console.log('isLoading:', this.isLoading);

    this.isLoading = true;
    const token = localStorage.getItem("jwt");

    console.log('JWT token from localStorage:', token ? 'Present' : 'Missing');

    if (!token) {
      console.error('No JWT token found! User needs to login.');
      alert('Please login first. No authentication token found.');
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });


    this.http.get<{ data: Client[] }>(this.CLIENTS_API, { headers }).subscribe({
      next: (res) => {
        console.log('=== SUCCESS: Clients API Response ===');
        console.log('Full response:', res);
        console.log('Response data:', res.data);
        console.log('Data type:', typeof res.data);
        console.log('Is array?', Array.isArray(res.data));

        if (res.data && Array.isArray(res.data)) {
          console.log('Number of clients received:', res.data.length);
          console.log('First few clients:', res.data.slice(0, 3));

          this.clients = res.data;
          this.filteredClients = [...res.data];

          console.log('Updated clients array length:', this.clients.length);
          console.log('Updated filteredClients array length:', this.filteredClients.length);
        } else {
          console.warn('Unexpected response format. Expected data array but got:', res);
          this.clients = [];
          this.filteredClients = [];
        }

        this.isLoading = false;
        console.log('=== END loadClients() - Success ===');
      },
      error: (err) => {
        console.error('=== ERROR: Failed to load clients ===');
        console.error('Error status:', err.status);
        console.error('Error status text:', err.statusText);
        console.error('Error message:', err.message);
        console.error('Error response body:', err.error);
        console.error('Full error object:', err);

        this.isLoading = false;

        // Detailed error handling
        if (err.status === 401) {
          console.error('Unauthorized: Invalid or expired JWT token');
          alert('Session expired. Please login again.');
          localStorage.removeItem('jwt');
        } else if (err.status === 403) {
          console.error('Forbidden: No permission to access clients');
          alert('You do not have permission to access clients.');
        } else if (err.status === 404) {
          console.error('Not Found: API endpoint not found');
          alert('Clients API endpoint not found.');
        } else if (err.status === 0) {
          console.error('Network Error: Cannot connect to server');
          alert('Cannot connect to server. Check your internet connection.');
        } else {
          console.error('Unknown error occurred');
          alert('Failed to load clients. Please try again.');
        }

        console.log('=== END loadClients() - Error ===');
      }
    });
  }

  // Load audits from API - Fixed TypeScript errors
  loadAudits() {
    console.log('=== START loadAudits() ===');

    const token = localStorage.getItem("jwt");

    console.log('JWT token for audits:', token ? 'Present' : 'Missing');

    if (!token) {
      console.error('No JWT token found! Cannot load audits.');
      alert('Please login first. No authentication token found.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Making GET request to:', this.AUDITS_API);
    console.log('Request headers:', headers);

    // Use 'any' type for response to handle different structures
    this.http.get<any>(this.AUDITS_API, { headers }).subscribe({
      next: (res: any) => {
        console.log('=== SUCCESS: Audits API Response ===');
        console.log('Full response:', res);
        console.log('Response type:', typeof res);
        console.log('Is array?', Array.isArray(res));

        if (Array.isArray(res)) {
          console.log('Number of audits received:', res.length);
          if (res.length > 0) {
            console.log('First audit object:', res[0]);
            console.log('Audit object keys:', Object.keys(res[0]));
          }

          // Transform the response to match our Audit interface
          this.auditEntities = res.map((audit: AuditApiResponse) => ({
            id: audit.auditId,
            name: audit.assessment_project_name || audit.auditId || 'Unnamed Audit'
          }));

          this.filteredAudits = [...this.auditEntities];

          console.log('Transformed audits:', this.auditEntities);
          console.log('Updated auditEntities array length:', this.auditEntities.length);
          console.log('Updated filteredAudits array length:', this.filteredAudits.length);
        } else if (res && res.data && Array.isArray(res.data)) {
          // Handle alternative response structure (data property)
          console.log('Alternative response structure with data property');
          this.auditEntities = res.data.map((audit: any) => ({
            id: audit.auditId || audit.id,
            name: audit.assessment_project_name || audit.name || audit.auditId || 'Unnamed Audit'
          }));
          this.filteredAudits = [...this.auditEntities];
        } else {
          console.warn('Unexpected response format:', res);
          this.auditEntities = [];
          this.filteredAudits = [];
        }

        console.log('=== END loadAudits() - Success ===');
      },
      error: (err) => {
        console.error('=== ERROR: Failed to load audits ===');
        console.error('Error status:', err.status);
        console.error('Error status text:', err.statusText);
        console.error('Error message:', err.message);
        console.error('Error response body:', err.error);
        console.error('Full error object:', err);

        // Detailed error handling
        if (err.status === 401) {
          console.error('Unauthorized: Invalid or expired JWT token');
          alert('Session expired. Please login again.');
          localStorage.removeItem('jwt');
        } else if (err.status === 403) {
          console.error('Forbidden: No permission to access audits');
          alert('You do not have permission to access audits.');
        } else if (err.status === 404) {
          console.error('Not Found: API endpoint not found');
          alert('Audits API endpoint not found.');
        } else if (err.status === 0) {
          console.error('Network Error: Cannot connect to server');
          alert('Cannot connect to server. Check your internet connection.');
        } else {
          console.error('Unknown error occurred');
          alert('Failed to load audits. Please try again.');
        }

        console.log('=== END loadAudits() - Error ===');
      }
    });
  }

  // Legal entity (client) search handler
  onLegalEntitySearch() {
    console.log('onLegalEntitySearch called');
    console.log('Search term:', this.legalEntitySearch);
    console.log('Total clients:', this.clients.length);

    const searchTerm = this.legalEntitySearch.toLowerCase();

    if (searchTerm.trim() === '') {
      console.log('Empty search term, showing all clients');
      this.filteredClients = [...this.clients];
    } else {
      console.log('Filtering clients with term:', searchTerm);
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm)
      );
      console.log('Filtered clients count:', this.filteredClients.length);
    }

    console.log('Updated filteredClients:', this.filteredClients);
  }

  // Audit search handler
  onAuditSearch() {
    console.log('onAuditSearch called');
    console.log('Search term:', this.auditSearch);
    console.log('Total audits:', this.auditEntities.length);

    const searchTerm = this.auditSearch.toLowerCase();

    if (searchTerm.trim() === '') {
      console.log('Empty search term, showing all audits');
      this.filteredAudits = [...this.auditEntities];
    } else {
      console.log('Filtering audits with term:', searchTerm);
      this.filteredAudits = this.auditEntities.filter(audit =>
        audit.name.toLowerCase().includes(searchTerm)
      );
      console.log('Filtered audits count:', this.filteredAudits.length);
    }

    console.log('Updated filteredAudits:', this.filteredAudits);
  }

  // Select a client
  selectClient(client: Client) {
    console.log('=== selectClient called ===');
    console.log('Selected client:', client);
    console.log('Client ID:', client.id);
    console.log('Client Name:', client.name);

    this.selectedClientId = client.id;
    this.legalEntitySearch = client.name;
    this.asvData.legalEntityName = client.name;
    this.showLegalEntityDropdown = false;

    console.log('Updated selectedClientId:', this.selectedClientId);
    console.log('Updated legalEntitySearch:', this.legalEntitySearch);
    console.log('=== END selectClient ===');
  }

  // Select an audit
  selectAudit(audit: Audit) {
    console.log('=== selectAudit called ===');
    console.log('Selected audit:', audit);
    console.log('Audit ID:', audit.id);
    console.log('Audit Name:', audit.name);

    this.selectedAuditId = audit.id;
    this.auditSearch = audit.name;
    this.asvData.audit = audit.name;
    this.showAuditDropdown = false;

    console.log('Updated selectedAuditId:', this.selectedAuditId);
    console.log('Updated auditSearch:', this.auditSearch);
    console.log('=== END selectAudit ===');
  }

  // Handle blur event for client search
  onLegalEntityBlur() {
    setTimeout(() => {
      this.showLegalEntityDropdown = false;
      console.log('onLegalEntityBlur: Dropdown hidden');
      console.log('Current legalEntitySearch:', this.legalEntitySearch);
      console.log('Current selectedClientId:', this.selectedClientId);

      if (this.legalEntitySearch && !this.selectedClientId) {
        console.log('Search term exists but no client selected');
        const matchedClient = this.clients.find(client =>
          client.name.toLowerCase() === this.legalEntitySearch.toLowerCase()
        );

        if (matchedClient) {
          console.log('Found matching client:', matchedClient);
          this.selectedClientId = matchedClient.id;
          this.asvData.legalEntityName = matchedClient.name;
        } else {
          console.log('No matching client found');
          this.selectedClientId = null;
          this.asvData.legalEntityName = this.legalEntitySearch;
        }
      }
    }, 200);
  }

  // Handle blur event for audit search
  onAuditBlur() {
    setTimeout(() => {
      this.showAuditDropdown = false;
      console.log('onAuditBlur: Dropdown hidden');
      console.log('Current auditSearch:', this.auditSearch);
      console.log('Current selectedAuditId:', this.selectedAuditId);

      if (this.auditSearch && !this.selectedAuditId) {
        console.log('Search term exists but no audit selected');
        const matchedAudit = this.auditEntities.find(audit =>
          audit.name.toLowerCase() === this.auditSearch.toLowerCase()
        );

        if (matchedAudit) {
          console.log('Found matching audit:', matchedAudit);
          this.selectedAuditId = matchedAudit.id;
          this.asvData.audit = matchedAudit.name;
        } else {
          console.log('No matching audit found');
          this.selectedAuditId = null;
          this.asvData.audit = this.auditSearch;
        }
      }
    }, 200);
  }

  // Parse IP details from textarea
  parseIPDetails(): IPDetail[] {
    console.log('parseIPDetails called');
    console.log('IPDetails text:', this.asvData.IPDetails);

    if (!this.asvData.IPDetails.trim()) {
      console.log('IPDetails is empty, returning empty array');
      return [];
    }

    // Split by newline, comma, semicolon, or space and clean up
    const ipPattern = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
    const ipMatches = this.asvData.IPDetails.match(ipPattern);

    if (ipMatches) {
      console.log('Found IP matches:', ipMatches);
      console.log('Number of IPs found:', ipMatches.length);

      const result = ipMatches.map(ip => ({ ip: ip.trim() }));
      console.log('Parsed IP details:', result);
      return result;
    }

    console.log('No valid IP addresses found');
    return [];
  }

  // Form submission
  onSubmit(form: NgForm) {
    console.log('=== START onSubmit() ===');
    console.log('Form valid:', form.valid);
    console.log('Form touched:', form.touched);
    console.log('Form dirty:', form.dirty);

    const token = localStorage.getItem("jwt");
    console.log('Current JWT token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.error('No JWT token found! Cannot submit form.');
      alert('Please login first. No authentication token found.');
      return;
    }

    // Run custom validation
    const formValid = this.isFormValid();
    console.log('Custom validation result:', formValid);
    console.log('Form data:', this.getFormData());

    if (form.valid && formValid) {
      this.isSubmitting = true;
      console.log('Form is valid, starting submission...');

      // Parse IP details
      const ipDetails = this.parseIPDetails();
      console.log('Parsed IP details:', ipDetails);

      // Prepare the request body according to API specification
      const requestBody = {
        client: this.selectedClientId,
        audit: this.selectedAuditId,
        number_of_ip: this.asvData.numberOfIPs || 0,
        associated_organization: this.asvData.associatedOrganization,
        associated_application: this.asvData.associatedApplication,
        ip_details: ipDetails,
        q1: "PENDING",
        q2: "PENDING",
        status: "PENDING"
      };

      console.log('=== Request Body for API ===');
      console.log('Full request body:', requestBody);
      console.log('JSON string:', JSON.stringify(requestBody, null, 2));

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      console.log('Making POST request to:', this.ADD_ASV_AUDIT_API);
      console.log('Request headers:', headers);

      // Call the API to add ASV audit
      this.http.post(this.ADD_ASV_AUDIT_API, requestBody, { headers })
        .pipe(
          catchError(error => {
            this.isSubmitting = false;
            console.error('=== ERROR: API Call Failed ===');
            console.error('Error status:', error.status);
            console.error('Error status text:', error.statusText);
            console.error('Error message:', error.message);
            console.error('Error response body:', error.error);
            console.error('Full error object:', error);

            // Show user-friendly error message
            let errorMessage = 'Failed to submit ASV audit. ';
            if (error.status === 401) {
              errorMessage = 'Session expired. Please log in again.';
              localStorage.removeItem('jwt');
            } else if (error.status === 400) {
              errorMessage = 'Invalid data provided. Please check your inputs.';
              console.log('Validation errors:', error.error);
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to create ASV audits.';
            } else if (error.status === 404) {
              errorMessage = 'Client or Audit not found.';
            } else if (error.status === 409) {
              errorMessage = 'ASV audit already exists for this client.';
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (error.status === 0) {
              errorMessage = 'Network error. Please check your connection.';
            } else {
              errorMessage += 'Please try again.';
            }

            alert(errorMessage);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response: any) => {
            this.isSubmitting = false;
            console.log('=== SUCCESS: API Response ===');
            console.log('Full response:', response);
            console.log('Response type:', typeof response);

            // Check for success message in response
            if (response.success === false) {
              console.warn('API returned success: false');
              alert(response.message || 'Failed to submit ASV audit.');
              return;
            }

            if (response.message) {
              console.log('Success message:', response.message);
              alert(response.message);
            } else if (response.status === 'success') {
              console.log('Success based on status field');
              alert('ASV Audit submitted successfully!');
            } else {
              console.log('No specific message, showing generic success');
              alert('ASV Audit submitted successfully!');
            }

            console.log('Resetting form...');
            this.resetForm(form);
            console.log('=== END onSubmit() - Success ===');
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('=== END onSubmit() - Error ===');
          }
        });

    } else {
      console.error('=== FORM VALIDATION FAILED ===');
      this.showErrors = true;

      // Mark all fields as touched to show errors
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });

      // Check which fields are invalid
      console.log('Field validation check:');
      console.log('numberOfIPs:', this.asvData.numberOfIPs);
      console.log('associatedOrganization:', this.asvData.associatedOrganization);
      console.log('associatedApplication:', this.asvData.associatedApplication);
      console.log('legalEntitySearch:', this.legalEntitySearch);
      console.log('auditSearch:', this.auditSearch);
      console.log('selectedClientId:', this.selectedClientId);
      console.log('selectedAuditId:', this.selectedAuditId);
      console.log('IPDetails length:', this.parseIPDetails().length);

      if (!this.asvData.numberOfIPs || this.asvData.numberOfIPs < 1) {
        alert('Please enter a valid number of IPs (minimum 1)');
      } else if (!this.asvData.associatedOrganization) {
        alert('Associated Organization is required');
      } else if (!this.asvData.associatedApplication) {
        alert('Associated Application is required');
      } else if (!this.auditSearch.trim()) {
        alert('Assessment/Project Name is required');
      } else if (!this.legalEntitySearch.trim()) {
        alert('Legal Entity Name is required');
      } else if (!this.selectedClientId) {
        alert('Please select a valid client from the dropdown');
      } else if (!this.selectedAuditId) {
        alert('Please select a valid audit from the dropdown');
      } else if (this.parseIPDetails().length === 0 && this.asvData.IPDetails.trim()) {
        alert('Please enter valid IP addresses in the IP Details field');
      }

      console.log('=== END onSubmit() - Validation Failed ===');
    }
  }

  resetForm(form: NgForm) {
    console.log('=== START resetForm() ===');

    form.resetForm();
    this.asvData = {
      numberOfIPs: null,
      IPDetails: '',
      associatedOrganization: '',
      associatedApplication: '',
      legalEntityName: '',
      audit: '',
    };
    this.legalEntitySearch = '';
    this.auditSearch = '';
    this.selectedClientId = null;
    this.selectedAuditId = null;
    this.filteredClients = [...this.clients];
    this.filteredAudits = [...this.auditEntities];
    this.showLegalEntityDropdown = false;
    this.showAuditDropdown = false;
    this.showErrors = false;
    this.ipArray = [];
    this.isSubmitting = false;

    console.log('Form reset complete');
    console.log('Current asvData:', this.asvData);
    console.log('=== END resetForm() ===');
  }

  onReset(form: NgForm) {
    console.log('Manual reset called');
    this.resetForm(form);
  }

  onInputChange(field: string, value: any) {
    console.log(`onInputChange: ${field} =`, value);

    if (field === 'numberOfIPs' && value < 1) {
      console.log('numberOfIPs less than 1, setting to 1');
      this.asvData.numberOfIPs = 1;
    }

    if (field === 'legalEntityName' && value !== this.legalEntitySearch) {
      console.log('legalEntityName changed, resetting selectedClientId');
      this.legalEntitySearch = value;
      this.selectedClientId = null;
      this.onLegalEntitySearch();
    }

    if (field === 'audit' && value !== this.auditSearch) {
      console.log('audit changed, resetting selectedAuditId');
      this.auditSearch = value;
      this.selectedAuditId = null;
      this.onAuditSearch();
    }

    // Update IP array when IP details change
    if (field === 'IPDetails') {
      console.log('IPDetails changed, parsing IPs');
      this.ipArray = this.parseIPDetails();
    }
  }

  getFormData() {
    return {
      ...this.asvData,
      clientId: this.selectedClientId,
      auditId: this.selectedAuditId,
      legalEntitySearch: this.legalEntitySearch,
      auditSearch: this.auditSearch,
      ipDetailsArray: this.parseIPDetails(),
      isValid: this.isFormValid()
    };
  }

  isFormValid(): boolean {
    const hasValidIPs = this.asvData.IPDetails.trim() === '' ||
      this.parseIPDetails().length > 0;

    const isValid = (
      this.asvData.numberOfIPs !== null &&
      this.asvData.numberOfIPs > 0 &&
      !!this.asvData.associatedOrganization.trim() &&
      !!this.asvData.associatedApplication.trim() &&
      !!this.legalEntitySearch.trim() &&
      !!this.auditSearch.trim() &&
      !!this.selectedClientId &&
      !!this.selectedAuditId &&
      hasValidIPs
    );

    console.log('isFormValid check:', {
      numberOfIPs: this.asvData.numberOfIPs !== null && this.asvData.numberOfIPs > 0,
      associatedOrganization: !!this.asvData.associatedOrganization.trim(),
      associatedApplication: !!this.asvData.associatedApplication.trim(),
      legalEntitySearch: !!this.legalEntitySearch.trim(),
      auditSearch: !!this.auditSearch.trim(),
      selectedClientId: !!this.selectedClientId,
      selectedAuditId: !!this.selectedAuditId,
      hasValidIPs: hasValidIPs,
      finalResult: isValid
    });

    return isValid;
  }

  // Additional helper methods
  clearLegalEntitySearch() {
    console.log('Clearing legal entity search');
    this.legalEntitySearch = '';
    this.selectedClientId = null;
    this.asvData.legalEntityName = '';
    this.filteredClients = [...this.clients];
    this.showLegalEntityDropdown = true;
  }

  clearAuditSearch() {
    console.log('Clearing audit search');
    this.auditSearch = '';
    this.selectedAuditId = null;
    this.asvData.audit = '';
    this.filteredAudits = [...this.auditEntities];
    this.showAuditDropdown = true;
  }

  // Get selected client details
  getSelectedClient(): Client | undefined {
    if (!this.selectedClientId) {
      console.log('No client selected');
      return undefined;
    }
    const client = this.clients.find(client => client.id === this.selectedClientId);
    console.log('Selected client:', client);
    return client;
  }

  // Get selected audit details
  getSelectedAudit(): Audit | undefined {
    if (!this.selectedAuditId) {
      console.log('No audit selected');
      return undefined;
    }
    const audit = this.auditEntities.find(audit => audit.id === this.selectedAuditId);
    console.log('Selected audit:', audit);
    return audit;
  }

  // Format IP details for display
  formatIPDetailsForDisplay(): string {
    const ipArray = this.parseIPDetails();
    const result = ipArray.map(item => item.ip).join(', ');
    console.log('Formatted IP details for display:', result);
    return result;
  }

  // Validate individual IP address
  isValidIP(ip: string): boolean {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const isValid = ipPattern.test(ip);
    console.log(`IP validation: "${ip}" = ${isValid}`);
    return isValid;
  }

  // Get current IP count from details
  getIPCountFromDetails(): number {
    const count = this.parseIPDetails().length;
    console.log(`IP count from details: ${count}`);
    return count;
  }

  // Refresh data
  refreshData() {
    console.log('Refreshing data...');
    this.loadClients();
    this.loadAudits();
  }

  // Debug method to check current state
  debugCurrentState() {
    console.log('=== DEBUG CURRENT STATE ===');
    console.log('clients array length:', this.clients.length);
    console.log('auditEntities array length:', this.auditEntities.length);
    console.log('selectedClientId:', this.selectedClientId);
    console.log('selectedAuditId:', this.selectedAuditId);
    console.log('legalEntitySearch:', this.legalEntitySearch);
    console.log('auditSearch:', this.auditSearch);
    console.log('asvData:', this.asvData);
    console.log('=== END DEBUG ===');
  }

  // Enhanced method to show IP parsing examples
  showIPParsingExamples(): void {
    const examples = [
      '192.168.1.1',
      '192.168.1.1, 192.168.1.2',
      '192.168.1.1\n192.168.1.2\n192.168.1.3',
      '192.168.1.1;192.168.1.2;192.168.1.3',
      '192.168.1.1 192.168.1.2 192.168.1.3'
    ];
    
    console.log('=== IP Parsing Examples ===');
    examples.forEach(example => {
      this.asvData.IPDetails = example;
      const parsed = this.parseIPDetails();
      console.log(`Input: "${example}" => Parsed:`, parsed);
    });
    this.asvData.IPDetails = '';
  }
}