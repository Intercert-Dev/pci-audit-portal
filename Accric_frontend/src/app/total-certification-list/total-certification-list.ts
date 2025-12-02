import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';


interface Client {
  company: string;
  certNo: string;
  standard: string;
  issueDate: string;
  validDate: string;
  status: string;
  previous_report: string;
  current_report: string;
  legalEntityName?: string;
  brandName?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  natureOfBusiness?: string;
  website?: string;
  typeOfBusiness?: string;
  primaryName?: string;
  primaryDesignation?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  technicalContact?: string;
  informationSecurityOfficer?: string;
  clientStatus?: string;
  clientSignoff?: string;
  assessmentName?: string;
  assessmentType?: string;
  assessmentCategory?: string;
  assessmentYear?: string;
  pciVersion?: string;
  periodCovered?: string;
  auditStart?: string;
  auditEnd?: string;
  reportSubmittedDate?: string;
  auditStatus?: string;
  certificateIssueDate?: string;
  certificateExpiryDate?: string;
  certificateNumberUniqueId?: string;
  assessmentClassification?: string;
  nextAuditDueDate?: string;
  nameOfQsa?: string;
  qsaLicense?: string;
  auditManagerReviewer?: string;
  scopeOfAssessment?: string;
  locationOfScope?: string;
  overallComplianceStatus?: string;
  compensatingControl?: string;
  customizedApproach?: string;
  nonConformitiesGap?: string;
  nonConformitiesGapIdentified?: string;
  remediationTargetDate?: string;
  revalidationDate?: string;
  previousReport?: string;
  currentReport?: string;
}

@Component({
  selector: 'app-total-certification-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './total-certification-list.html',
  styleUrl: './total-certification-list.css',
})


export class TotalCertificationList implements OnInit {
  search_text: string = "";
  editingClient: Client | null = null;
  clientList: Client[] = [];
  filtered_list: Client[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const url = 'http://pci.accric.com/api/auth/clients-with-certificate';
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
          standard: item.pci_dss_version_application || '',
          issueDate: item.certificate_issue_date || '',
          validDate: item.certificate_expiry_date || '',
          status: item.audit_status || '',
          previous_report: item.previous_report || '',
          current_report: item.current_report || '',
          legalEntityName: item.legal_entity_name || '',
          brandName: item.trading_name || '',
          country: item.county_name || '',
          state: item.state_name || '',
          city: item.city_name || '',
          street: item.street_name || '',
          zipCode: item.zip_name || '',
          natureOfBusiness: item.nature_of_business || '',
          website: item.website_domain_url || '',
          typeOfBusiness: item.type_of_business || '',
          primaryName: item.contact_name || '',
          primaryDesignation: item.designation || '',
          primaryEmail: item.contact_email || '',
          primaryPhone: item.phone || '',
          technicalContact: item.technical_contacts || '',
          informationSecurityOfficer: item.information_security_officer || '',
          clientStatus: item.client_status || '',
          clientSignoff: item.client_signoff_authority || '',
          assessmentName: item.assessment_project_name || '',
          assessmentType: item.assessment_type || '',
          assessmentCategory: item.assessment_category || '',
          assessmentYear: item.assessment_year || '',
          pciVersion: item.pci_dss_version_application || '',
          periodCovered: item.assessment_period_covered || '',
          auditStart: item.audit_start_date || '',
          auditEnd: item.audit_end_date || '',
          reportSubmittedDate: item.date_of_report_submission || '',
          auditStatus: item.audit_status || '',
          certificateIssueDate: item.certificate_issue_date || '',
          certificateExpiryDate: item.certificate_expiry_date || '',
          certificateNumberUniqueId: item.certificate_number_unique_id || '',
          assessmentClassification: item.assessment_classification || '',
          nextAuditDueDate: item.next_audit_due_date || '',
          nameOfQsa: item.name_of_qsa || '',
          qsaLicense: item.qsa_license_certificate_number || '',
          auditManagerReviewer: item.audit_manager_reviewer_name || '',
          scopeOfAssessment: item.scope_of_assessment || '',
          locationOfScope: item.location_of_scope || '',
          overallComplianceStatus: item.overall_compliance_status || '',
          compensatingControl: item.compensating_controls_used || '',
          customizedApproach: item.customized_approach_used || '',
          nonConformitiesGap: item.non_conformities_gap || '',
          nonConformitiesGapIdentified: item.non_conformities_gap_identified || '',
          remediationTargetDate: item.remediation_target_date || '',
          revalidationDate: item.revalidation_date || '',
          previousReport: item.previous_report || '',
          currentReport: item.current_report || '',
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
      item.standard?.toLowerCase().includes(search) ||
      item.issueDate?.toLowerCase().includes(search) ||
      item.validDate?.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search)
    );
  }

  exportToExcel() {
    const fileName = 'Client-Certificates.xlsx';
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filtered_list.map(client => ({
      'Company': client.company,
      'Cert No': client.certNo,
      'Standard': client.standard,
      'Issue Date': client.issueDate,
      'Valid Date': client.validDate,
      'Status': client.status
    })));
    const wb: XLSX.WorkBook = { Sheets: { 'Certificates': ws }, SheetNames: ['Certificates'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  editClient(client: Client) {
    this.editingClient = JSON.parse(JSON.stringify(client));
  }

  saveClient() {
    if (!this.editingClient) return;

    const index = this.clientList.findIndex(item =>
      item.certNo === this.editingClient!.certNo ||
      item.certificateNumberUniqueId === this.editingClient!.certificateNumberUniqueId
    );

    if (index !== -1) {
      this.clientList[index] = { ...this.editingClient };
      this.clientList[index].company = this.editingClient.legalEntityName || this.editingClient.company;
      this.clientList[index].certNo = this.editingClient.certificateNumberUniqueId || this.editingClient.certNo;
      this.clientList[index].standard = this.editingClient.pciVersion || this.editingClient.assessmentType || this.editingClient.standard;
      this.clientList[index].issueDate = this.editingClient.certificateIssueDate || this.editingClient.issueDate;
      this.clientList[index].validDate = this.editingClient.certificateExpiryDate || this.editingClient.validDate;
      this.clientList[index].status = this.editingClient.auditStatus || this.editingClient.status;
      this.clientList[index].previous_report = this.editingClient.previousReport || this.editingClient.previous_report;
      this.clientList[index].current_report = this.editingClient.currentReport || this.editingClient.current_report;

      this.filtered_list = [...this.clientList];
      this.cdr.detectChanges();
    }

    this.cancelEdit();
    alert('Client information updated successfully!');
  }

  cancelEdit() {
    this.editingClient = null;
  }

  viewPDF(url: string | undefined) {
    if (!url) {
      alert("PDF not available!");
      return;
    }
    window.open(url, "_blank");
  }

  onUpload(type: 'previous' | 'current') {
    alert('File upload functionality would be implemented here. In real app, you would upload to server.');
  }

  onPreview(type: 'previous' | 'current') {
    if (!this.editingClient) return;

    const url = type === 'previous'
      ? this.editingClient.previousReport
      : this.editingClient.currentReport;

    this.viewPDF(url);
  }

  onDownload(type: 'previous' | 'current') {
    if (!this.editingClient) return;

    const url = type === 'previous'
      ? this.editingClient.previousReport
      : this.editingClient.currentReport;

    if (url) {
      window.open(url, "_blank");
    } else {
      alert(`No ${type} report available for download.`);
    }
  }

  deleteRow(row: Client) {
    if (!confirm("Are you sure you want to delete this client?")) return;

    this.clientList = this.clientList.filter(item =>
      item.certNo !== row.certNo &&
      item.certificateNumberUniqueId !== row.certificateNumberUniqueId
    );
    this.filtered_list = [...this.clientList];
    this.cdr.detectChanges();
  }
}
