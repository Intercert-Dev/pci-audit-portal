import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface DateErrors {
  auditStart: string;
  auditEnd: string;
  reportSubmittedDate: string;
  certificateIssueDate: string;
  certificateExpiryDate: string;
  nextAuditDueDate: string;
}

interface LegalEntity {  // Capitalized interface name
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-audit.html',
  styleUrl: './add-audit.css',
})
export class AddAudit implements OnInit {
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
    legalEntityId: null as number | null,
    legalEntityName: ''
  };

  dateErrors: DateErrors = {
    auditStart: '',
    auditEnd: '',
    reportSubmittedDate: '',
    certificateIssueDate: '',
    certificateExpiryDate: '',
    nextAuditDueDate: ''
  };

  legalEntitySearch: string = '';
  legalEntities: LegalEntity[] = [];
  filteredLegalEntities: LegalEntity[] = [];
  selectedLegalEntityId: number | null = null;
  showLegalEntityDropdown: boolean = false;
  private searchSubject = new Subject<string>();

  tabRequiredFields: { [key: string]: string[] } = {
    "assessment-summary": ["auditStart", "auditEnd"],
    "assessor-info": [],
    "scope-env": []
  };

  ngOnInit() {
    this.loadLegalEntities();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterLegalEntities(searchTerm);
    });
  }

  loadLegalEntities() {
    // Replace with your actual API call
    const url = 'YOUR_API_ENDPOINT/legal-entities';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    this.http.get<LegalEntity[]>(url, { headers }).subscribe({
      next: (entities) => {
        this.legalEntities = entities;
        this.filteredLegalEntities = [...entities];
      },
      error: (err) => {
        console.error('Failed to load legal entities:', err);
      }
    });
  }

  onLegalEntitySearch() {
    this.searchSubject.next(this.legalEntitySearch);
  }

  filterLegalEntities(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredLegalEntities = [...this.legalEntities];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredLegalEntities = this.legalEntities.filter(entity =>
      entity.name.toLowerCase().includes(term)
    );
  }

  selectLegalEntity(entity: LegalEntity) {
    this.selectedLegalEntityId = entity.id;
    this.legalEntitySearch = entity.name;
    this.auditData.legalEntityId = entity.id;
    this.auditData.legalEntityName = entity.name;
    this.showLegalEntityDropdown = false;
  }

  onLegalEntityBlur() {
    setTimeout(() => {
      this.showLegalEntityDropdown = false;

      if (!this.selectedLegalEntityId && this.legalEntitySearch) {
        const matchedEntity = this.legalEntities.find(entity =>
          entity.name.toLowerCase() === this.legalEntitySearch.toLowerCase()
        );

        if (matchedEntity) {
          this.selectLegalEntity(matchedEntity);
        } else {
          this.legalEntitySearch = '';
          this.auditData.legalEntityId = null;
          this.auditData.legalEntityName = '';
        }
      }
    }, 200);
  }

  // Date validation methods - FIXED
  validateDates(): boolean {
    this.clearDateErrors();
    let isValid = true;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // 1. Audit Start Date validations - FIXED
    if (this.auditData.auditStart) {
      const auditStartDate = new Date(this.auditData.auditStart);

      // Audit Start Date can be today or in the future, but not in the past
      if (auditStartDate < currentDate) {
        this.dateErrors.auditStart = 'Audit Start Date cannot be in the past';
        isValid = false;
      }
    }

    // 2. Audit End Date validations
    if (this.auditData.auditEnd) {
      const auditEndDate = new Date(this.auditData.auditEnd);

      // Audit End Date should not be in the future (if audit is completed)
      if (auditEndDate > currentDate && this.auditData.auditStatus === 'COMPLETED') {
        this.dateErrors.auditEnd = 'Completed audit cannot have future end date';
        isValid = false;
      }

      // Audit End Date must be after Audit Start Date
      if (this.auditData.auditStart && auditEndDate <= new Date(this.auditData.auditStart)) {
        this.dateErrors.auditEnd = 'Audit End Date must be after Audit Start Date';
        isValid = false;
      }
    }

    // 3. Report Submission Date validations
    if (this.auditData.reportSubmittedDate) {
      const reportDate = new Date(this.auditData.reportSubmittedDate);


      // Report date should be after audit start date
      if (this.auditData.auditEnd && reportDate < new Date(this.auditData.auditEnd)) {
        this.dateErrors.reportSubmittedDate = 'Report Submission Date cannot be before Audit End Date';
        isValid = false;
      }
    }

    // 4. Certificate Issue Date validations
    if (this.auditData.certificateIssueDate) {
      const certIssueDate = new Date(this.auditData.certificateIssueDate);

      // Certificate issue date should not be in the future
      if (certIssueDate > currentDate) {
        this.dateErrors.certificateIssueDate = 'Certificate Issue Date cannot be in the future';
        isValid = false;
      }

      // Certificate issue date should be after audit end date
      if (this.auditData.auditEnd && certIssueDate < new Date(this.auditData.auditEnd)) {
        this.dateErrors.certificateIssueDate = 'Certificate Issue Date cannot be before Audit End Date';
        isValid = false;
      }
    }

    // 5. Certificate Expiry Date validations
    if (this.auditData.certificateExpiryDate) {
      const certExpiryDate = new Date(this.auditData.certificateExpiryDate);

      // Certificate expiry date should be after certificate issue date
      if (this.auditData.certificateIssueDate && certExpiryDate <= new Date(this.auditData.certificateIssueDate)) {
        this.dateErrors.certificateExpiryDate = 'Certificate Expiry Date must be after Certificate Issue Date';
        isValid = false;
      }

      // Certificate expiry date should not be too far in the future (optional: max 3 years)
      const maxExpiryDate = new Date();
      maxExpiryDate.setFullYear(maxExpiryDate.getFullYear() + 3);
      if (certExpiryDate > maxExpiryDate) {
        this.dateErrors.certificateExpiryDate = 'Certificate Expiry Date cannot be more than 3 years in the future';
        isValid = false;
      }
    }

    // 6. Next Audit Due Date validations
    if (this.auditData.nextAuditDueDate) {
      const nextAuditDate = new Date(this.auditData.nextAuditDueDate);

      // Next audit due date should be in the future
      if (nextAuditDate <= currentDate) {
        this.dateErrors.nextAuditDueDate = 'Next Audit Due Date must be in the future';
        isValid = false;
      }

      // Next audit due date should be after certificate expiry date (if certificate exists)
      if (this.auditData.certificateExpiryDate && nextAuditDate <= new Date(this.auditData.certificateExpiryDate)) {
        this.dateErrors.nextAuditDueDate = 'Next Audit Due Date should be after Certificate Expiry Date';
        isValid = false;
      }

      // Next audit due date should not be too far in the future (optional: max 3 years)
      const maxNextAuditDate = new Date();
      maxNextAuditDate.setFullYear(maxNextAuditDate.getFullYear() + 3);
      if (nextAuditDate > maxNextAuditDate) {
        this.dateErrors.nextAuditDueDate = 'Next Audit Due Date cannot be more than 3 years in the future';
        isValid = false;
      }
    }

    return isValid;
  }

  clearDateErrors(): void {
    this.dateErrors = {
      auditStart: '',
      auditEnd: '',
      reportSubmittedDate: '',
      certificateIssueDate: '',
      certificateExpiryDate: '',
      nextAuditDueDate: ''
    };
  }

  onDateChange(fieldName: string): void {
    // Trigger validation when date changes
    this.validateDates();
  }

  // Update the validateCurrentTab method to include date validations
  validateCurrentTab(form: NgForm): boolean {
    const requiredFields: string[] = this.tabRequiredFields[this.activeTab] || [];

    // Validate required fields
    const requiredValid = requiredFields.every((fieldName: string) => {
      const control = form.controls[fieldName];
      return control && control.valid;
    });

    // Validate dates for assessment-summary tab
    let datesValid = true;
    if (this.activeTab === 'assessment-summary') {
      datesValid = this.validateDates();
    }

    return requiredValid && datesValid;
  }

  focusOnFirstError(): void {
    // Find the first date error and focus on that field
    const errorEntries = Object.entries(this.dateErrors).find(([key, value]) => value);

    if (errorEntries) {
      const [firstErrorField] = errorEntries;
      const inputElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    } else {
      // If no date errors, find first form error
      const invalidControl = document.querySelector('.ng-invalid');
      if (invalidControl) {
        (invalidControl as HTMLInputElement).focus();
      }
    }
  }

  saveAndContinue(form: NgForm) {
    // Validate current tab before proceeding
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      this.focusOnFirstError();
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
          this.focusOnFirstError();
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
      this.focusOnFirstError();
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
      location_in_scope: this.auditData.locationOfScope,
      // ADDED legal entity fields
      legal_entity_id: this.auditData.legalEntityId,
      legal_entity_name: this.auditData.legalEntityName
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
        this.resetForm();
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to create audit. Check console for details.');
      }
    });
  }

  private resetForm(): void {
    if (this.auditForm) {
      this.auditForm.resetForm();
    }
    this.activeTab = 'assessment-summary';
    this.showErrors = false;
    this.clearDateErrors();
    // Clear legal entity search
    this.legalEntitySearch = '';
    this.selectedLegalEntityId = null;
    this.auditData.legalEntityId = null;
    this.auditData.legalEntityName = '';
    this.filteredLegalEntities = [...this.legalEntities];
  }

  constructor(private http: HttpClient) { }
}