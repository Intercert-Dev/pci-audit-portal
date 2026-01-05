import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../service/toast-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Assessment {
  project_name: string;
  assessment_type: string;
  assessment_category: string;
  assessment_year: string;
  pci_dss_version: string;
  assessment_period: string;
  audit_start_date: string | null;
  audit_end_date: string | null;
  report_submission_date: string | null;
  audit_status: string;
  classification: string | null;
  next_audit_due_date: string | null;
  qsa_name: string;
  qsa_license_number: string;
  reviewer_name: string;
  scope_of_assessment: string | null;
  location_in_scope: string | null;

  // ASV fields
  asv_number_of_ip?: string;
  asv_ip_domain_details?: string;

  // Report URLs
  previous_aoc_report_url?: string;
  previous_roc_report_url?: string;
  previous_final_report_url?: string;
  aoc_report_url?: string | null;
  roc_report_url?: string | null;
  final_report_url?: string | null;
}

interface Client {
  clientId?: string;
  legal_entity_name: string;
  trading_name?: string;
  county_name: string;
  state_name?: string;
  city_name?: string;
  street_name?: string;
  zip_name?: string;
  nature_of_business?: string | null;
  website_domain_url?: string | null;
  type_of_business?: string;

  contact_name: string;
  designation?: string;
  contact_email: string;
  phone: string;
  technical_contacts?: string | null;
  information_security_officer?: string | null;
  client_signoff_authority: string;
  client_status: string;

  created_at: string;
  updated_at?: string;

  company?: string;

  assessments?: Assessment[];

  // Certificate details (taken from first assessment if exists)
  certificate_issue_date?: string | null;
  certificate_expiry_date?: string | null;
  certificate_number?: string | null;
}

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-details.html',
  styleUrl: './company-details.css',
})
export class CompanyDetails implements OnInit {
  client: Client | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const clientId = this.route.snapshot.paramMap.get('id');

    if (!clientId) {
      this.toast.error('Invalid client ID in URL');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.fetchClientDetails(clientId);
  }

  private fetchClientDetails(clientId: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const url = `https://pci.accric.com/api/auth/client-list-Details/${clientId}`;
    const token = localStorage.getItem('jwt');

    if (!token) {
      this.toast.error('Authentication token not found. Please log in again.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        
        const apiData = response.data[0];

        this.client = {
          clientId: apiData.clientId,
          legal_entity_name: apiData.legal_entity_name,
          trading_name: apiData.trading_name,
          county_name: apiData.county_name,
          state_name: apiData.state_name,
          city_name: apiData.city_name,
          street_name: apiData.street_name,
          zip_name: apiData.zip_name,
          nature_of_business: apiData.nature_of_business,
          website_domain_url: apiData.website_domain_url,
          type_of_business: apiData.type_of_business,
          contact_name: apiData.contact_name,
          designation: apiData.designation,
          contact_email: apiData.contact_email,
          phone: apiData.phone,
          technical_contacts: apiData.technical_contacts,
          information_security_officer: apiData.information_security_officer,
          client_signoff_authority: apiData.client_signoff_authority,
          client_status: apiData.client_status,
          created_at: apiData.created_at,
          updated_at: apiData.updated_at,
          company: apiData.legal_entity_name,
          assessments: [],
        };

        if (apiData.audits && apiData.audits.length > 0) {
          this.client.assessments = apiData.audits.map((audit: any) => {
            const asv = audit.asvAudits && audit.asvAudits.length > 0 ? audit.asvAudits[0] : null;
            const rv = audit.reportVerifications && audit.reportVerifications.length > 0 ? audit.reportVerifications[0] : null;

            return {
              project_name: audit.assessment_project_name || 'N/A',
              assessment_type: audit.assessment_type || '',
              assessment_category: audit.assessment_category || '',
              assessment_year: audit.assessment_year || '',
              pci_dss_version: audit.pci_dss_version_application || '',
              assessment_period: audit.assessment_period_covered || '',
              audit_start_date: audit.audit_start_date,
              audit_end_date: audit.audit_end_date,
              report_submission_date: audit.date_of_report_submission,
              audit_status: audit.audit_status,
              classification: audit.classification,
              next_audit_due_date: audit.next_audit_due_date,
              qsa_name: audit.name_of_qsa || 'N/A',
              qsa_license_number: audit.qsa_license_certificate_number || 'N/A',
              reviewer_name: audit.audit_manager_reviewer_name || 'N/A',
              scope_of_assessment: audit.scope_of_assessment,
              location_in_scope: audit.location_of_scope,

              // ASV Details
              asv_number_of_ip: asv ? asv.number_of_ip.toString() : undefined,
              asv_ip_domain_details: asv ? asv.ip_details.map((ip: any) => ip.ip).join(', ') : undefined,

              // Report URLs
              previous_aoc_report_url: rv?.prev_aoc_report?.[0] || undefined,
              previous_roc_report_url: rv?.prev_roc_report?.[0] || undefined,
              previous_final_report_url: rv?.prev_final_report?.[0] || undefined,
              aoc_report_url: rv?.current_aoc_report || null,
              roc_report_url: rv?.current_roc_report || null,
              final_report_url: rv?.current_final_report || null,
            };
          });

          // Certificate details from first audit (if any)
          const firstAudit = apiData.audits[0];
          this.client.certificate_issue_date = firstAudit.certificate_issue_date;
          this.client.certificate_expiry_date = firstAudit.certificate_expiry_date;
          this.client.certificate_number = firstAudit.certificate_number_unique_id;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching client details:', err);
        let message = 'Failed to load client details.';
        if (err.status === 404) message = 'Client not found.';
        else if (err.status === 401) message = 'Unauthorized. Please log in again.';
        this.toast.error(message);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openReport(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }
}