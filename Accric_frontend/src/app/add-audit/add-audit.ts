import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-add-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-audit.html',
  styleUrl: './add-audit.css',
})
export class AddAudit {
  @ViewChild('auditForm') auditForm!: NgForm;

  activeTab = 'assessment-summary';
  showErrors = false;

  tabs = [
    'assessment-summary',
    'assessor-info',
    'scope-env'
  ];
  qsaList = [
    'Milan',
  ];

  auditData = {
    assessmentName: '',
    assessmentType: '',
    assessmentCategory: '',
    assessmentYear: '',
    pciVersion: '',
    periodCovered: '',
    auditStart: '',
    auditEnd: '',
    reportSubmittedDate: '',
    auditStatus: '',
    certificateIssueDate: '',
    certificateExpiryDate: '',
    certificateNumberUniqueId: '',
    assessmentClassification: '',
    nextAuditDueDate: '',
    nameOfQsa: '',
    qsaLicense: '',
    auditManagerReviewer: '',
    scopeOfAssessment: '',
    locationOfScope: '',
  };

  tabRequiredFields: { [key: string]: string[] } = {
    "assessment-summary": ["auditStart", "auditEnd"],
    "assessor-info": [],
    "scope-env": []
  };

  private buildPayload(): { [key: string]: any } {
    return {
      assessment_name: this.auditData.assessmentName,
      assessment_type: this.auditData.assessmentType,
      assessment_category: this.auditData.assessmentCategory,
      assessment_year: this.auditData.assessmentYear,
      pci_dss_version: this.auditData.pciVersion,
      assessment_period_covered: this.auditData.periodCovered,
      audit_start_date: this.formatDate(this.auditData.auditStart),
      audit_end_date: this.formatDate(this.auditData.auditEnd),
      report_submitted_date: this.formatDate(this.auditData.reportSubmittedDate),
      audit_status: this.auditData.auditStatus,
      certificate_issue_date: this.formatDate(this.auditData.certificateIssueDate),
      certificate_expiry_date: this.formatDate(this.auditData.certificateExpiryDate),
      certificate_number: this.auditData.certificateNumberUniqueId,
      assessment_classification: this.auditData.assessmentClassification,
      next_audit_due_date: this.formatDate(this.auditData.nextAuditDueDate),
      qsa_name: this.auditData.nameOfQsa,
      qsa_license: this.auditData.qsaLicense,
      manager_reviewer_name: this.auditData.auditManagerReviewer,
      scope_of_assessment: this.auditData.scopeOfAssessment,
      location_in_scope: this.auditData.locationOfScope
    };
  }

  private formatDate(dateString: string): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  private sendAuditDataToAPI(formData: FormData) {
    const url = 'YOUR_API_ENDPOINT_HERE'; // Replace with your API endpoint
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    this.http.post(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Audit created successfully!');
        // Reset form or navigate away
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to create audit. Check console for details.');
      }
    });
  }

  validateCurrentTab(form: NgForm): boolean {
    const requiredFields: string[] = this.tabRequiredFields[this.activeTab] || [];

    // First, mark all required fields as touched to show errors
    requiredFields.forEach((fieldName: string) => {
      const control = form.controls[fieldName];
      if (control) {
        control.markAsTouched();
      }
    });

    // Check if all required fields are valid
    return requiredFields.every((fieldName: string) => {
      const control = form.controls[fieldName];
      return control && control.valid;
    });
  }

  saveAndContinue(form: NgForm) {
    // Validate current tab before proceeding
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      return;
    }

    this.showErrors = false;
    const currentIndex = this.tabs.indexOf(this.activeTab);

    // Check if we're on the last tab
    if (currentIndex < this.tabs.length - 1) {
      // Move to next tab
      this.activeTab = this.tabs[currentIndex + 1];
    } else {
      // If on last tab, submit the form
      this.onSubmit(form);
    }
  }

  switchTab(tabName: string) {
    // Validate current tab before switching
    if (tabName !== this.activeTab) {
      const currentIndex = this.tabs.indexOf(this.activeTab);
      const targetIndex = this.tabs.indexOf(tabName);

      // Only validate if moving forward (to next tab)
      if (targetIndex > currentIndex) {
        if (this.auditForm && !this.validateCurrentTab(this.auditForm)) {
          this.showErrors = true;
          return;
        }
      }

      this.showErrors = false;
      this.activeTab = tabName;
    }
  }

  goBack() {
    const currentIndex = this.tabs.indexOf(this.activeTab);
    if (currentIndex > 0) {
      this.activeTab = this.tabs[currentIndex - 1];
      this.showErrors = false;
    }
  }

  onSubmit(form: NgForm) {
    // Validate all tabs before final submission
    let allTabsValid = true;

    for (const tab of this.tabs) {
      this.activeTab = tab; // Temporarily switch to each tab for validation
      if (!this.validateCurrentTab(form)) {
        allTabsValid = false;
      }
    }

    // Switch back to last tab if validation failed
    if (!allTabsValid) {
      this.activeTab = this.tabs[this.tabs.length - 1];
      this.showErrors = true;
      return;
    }

    // All validation passed, proceed with submission
    this.showErrors = false;

    const payload: { [key: string]: any } = this.buildPayload();
    const formData = new FormData();

    // Convert payload to FormData
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Send to API
    this.sendAuditDataToAPI(formData);
  }

  constructor(private http: HttpClient) { }
}