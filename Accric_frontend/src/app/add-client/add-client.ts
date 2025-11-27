import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-client.html',
  styleUrls: ['./add-client.css']
})
export class AddClient {

  activeTab: string = 'client-profile';
  showErrors = false;

  previousReportFile: File | null = null;
  currentReportFile: File | null = null;

  previousReportUrl: string | null = null;
  currentReportUrl: string | null = null;

  constructor(private http: HttpClient) { }

  tabs = [
    'client-profile',
    'primary-contacts',
    'assessment-summary',
    'assessor-info',
    'scope-env',
    'compliance-results',
    'report-verification'
  ];

  clientData: any = {
    legalEntityName: '',
    brandName: '',
    country: '',
    state: '',
    city: '',
    street: '',
    zipCode: '',
    natureOfBusiness: '',
    website: '',
    typeOfBusiness: '',

    primaryName: '',
    primaryDesignation: '',
    primaryEmail: '',
    primaryPhone: '',
    technicalContacts: '',
    informationSecurityOfficer: '',
    clientSignoffAuthority: '',

    assessmentName: '',
    assessmentType: '',
    assessmentCategory: '',
    assessmentClassification: '',
    assessmentYear: '',
    pciVersion: '',
    periodCovered: '',

    auditStart: '',
    auditEnd: '',
    reportSubmittedDate: '',
    auditStatus: '',

    certificateIssueDate: '',
    certificateExpiryDate: '',
    certificateNumber: '',
    nextAuditDueDate: '',

    nameOfQsa: '',
    qsaLicense: '',
    auditManagerReviewer: '',

    scopeOfAssessment: '',
    locationOfScope: '',
    overallComplianceStatus: '',
    compensatingControl: '',
    customizedApproach: '',
    nonConformitiesGap: '',
    nonConformitiesGapIdentified: '',

    remediationTargetDate: '',
    revalidationDate: ''
  };

  tabRequiredFields: { [key: string]: string[] } = {
    "client-profile": ["legalEntityName", "country", "state", "city", "street", "zipCode", "typeOfBusiness"],
    "primary-contacts": ["primaryName", "primaryDesignation", "primaryEmail", "primaryPhone", "clientSignoffAuthority"],
    "assessment-summary": ["auditStart", "auditEnd", "auditStatus"],
    "assessor-info": [],
    "scope-env": [],
    "compliance-results": [],
    "report-verification": []
  };


  formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]; // YYYY-MM-DD
  }


  private buildPayload() {
    return {
      legal_entity_name: this.clientData.legalEntityName,
      trading_name: this.clientData.brandName,
      county_name: this.clientData.country,
      state_name: this.clientData.state,
      city_name: this.clientData.city,
      street_name: this.clientData.street,
      zip_name: this.clientData.zipCode,
      nature_of_business: this.clientData.natureOfBusiness,
      website_domain_url: this.clientData.website,
      type_of_business: this.clientData.typeOfBusiness,

      contact_name: this.clientData.primaryName,
      designation: this.clientData.primaryDesignation,
      contact_email: this.clientData.primaryEmail,
      phone: this.clientData.primaryPhone,
      technical_contacts: this.clientData.technicalContacts,
      information_security_officer: this.clientData.informationSecurityOfficer,
      client_signoff_authority: this.clientData.clientSignoffAuthority,

      assessment_project_name: this.clientData.assessmentName,
      assessment_type: this.clientData.assessmentType,
      assessment_category: this.clientData.assessmentCategory,
      assessment_classification: this.clientData.assessmentClassification,
      assessment_year: this.clientData.assessmentYear,
      pci_dss_version_application: this.clientData.pciVersion,
      assessment_period_covered: this.clientData.periodCovered,

      audit_start_date: this.formatDate(this.clientData.auditStart),
      audit_end_date: this.formatDate(this.clientData.auditEnd),
      date_of_report_submission: this.formatDate(this.clientData.reportSubmittedDate),
      audit_status: this.clientData.auditStatus,

      certificate_issue_date: this.formatDate(this.clientData.certificateIssueDate),
      certificate_expiry_date: this.formatDate(this.clientData.certificateExpiryDate),
      certificate_number_unique_id: this.clientData.certificateNumber,
      next_audit_due_date: this.formatDate(this.clientData.nextAuditDueDate),

      name_of_qsa: this.clientData.nameOfQsa,
      qsa_license_certificate_number: this.clientData.qsaLicense,
      audit_manager_reviewer_name: this.clientData.auditManagerReviewer,

      scope_of_assessment: this.clientData.scopeOfAssessment,
      location_of_scope: this.clientData.locationOfScope,
      overall_compliance_status: this.clientData.overallComplianceStatus,
      compensating_controls_used: this.clientData.compensatingControl,
      customized_approach_used: this.clientData.customizedApproach,
      non_conformities_gap: this.clientData.nonConformitiesGap,
      non_conformities_gap_identified: this.clientData.nonConformitiesGapIdentified,

      remediation_target_date: this.formatDate(this.clientData.remediationTargetDate),
      revalidation_date: this.formatDate(this.clientData.revalidationDate)
    };
  }

  private sendClientDataToAPI(formData: any) {
    const url = 'http://pci.accric.com/api/auth/create-client';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Client created successfully!');
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to create client. Check console for details.');
      }
    });
  }

  onUpload(type: 'previous' | 'current') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert("Only PDF file is allowed!");
        return;
      }

      if (type === 'previous') {
        this.previousReportFile = file;
        this.previousReportUrl = URL.createObjectURL(file);
      } else {
        this.currentReportFile = file;
        this.currentReportUrl = URL.createObjectURL(file);
      }
    };

    input.click();
  }

  onPreview(type: 'previous' | 'current') {
    const url = type === 'previous' ? this.previousReportUrl : this.currentReportUrl;
    if (!url) return;
    window.open(url, '_blank');
  }

  onDownload(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;
    if (!file) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
  }

  validateCurrentTab(form: NgForm): boolean {
    const requiredFields: string[] = this.tabRequiredFields[this.activeTab] || [];
    let isValid = true;

    requiredFields.forEach((fieldName: string) => {
      const control = form.controls[fieldName];
      if (control && control.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    return isValid;
  }

  saveAndContinue(form: NgForm) {
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      return;
    }
    this.showErrors = false;
    const currentIndex = this.tabs.indexOf(this.activeTab);
    if (currentIndex < this.tabs.length - 1) {
      this.activeTab = this.tabs[currentIndex + 1];
    }
  }

  switchTab(tabName: string, form?: NgForm) {
    if (form && tabName !== this.activeTab) {
      if (!this.validateCurrentTab(form)) {
        this.showErrors = true;
        return;
      }
    }
    this.showErrors = false;
    this.activeTab = tabName;
  }

  goBack() {
    const currentIndex = this.tabs.indexOf(this.activeTab);
    if (currentIndex > 0) this.activeTab = this.tabs[currentIndex - 1];
  }

  onSubmit(form: NgForm) {
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      return;
    }

    if (form.valid) {
      console.log("Form Data:", this.clientData);
      console.log("Previous Report File:", this.previousReportFile);
      console.log("Current Report File:", this.currentReportFile);

      const payload = this.buildPayload();
      this.sendClientDataToAPI(payload);
    }
  }

}
