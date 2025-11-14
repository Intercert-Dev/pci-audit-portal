import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-client.html',
  styleUrls: ['./add-client.css']
})
export class AddClient {
  // Define all form fields with sensible defaults
  activeTab: string = 'client-profile';
  tabs = [
    'client-profile',
    'primary-contacts',
    'assessment-summary',
    'assessor-info',
    'scope-env',
    'compliance-results'
  ];


  client: any = {
    // Client Profile
    legalEntityName: '',
    tradingName: '',
    country: '',
    state: '',
    city: '',
    street: '',
    zipCode: '',
    website: '',
    typeOfBusiness: '',
    natureOfBusiness: '',

    // Primary Contacts
    primaryName: '',
    designation: '',
    email: '',
    phone: '',
    technicalContact: '',
    ciso: '',
    signOff: '',

    // Assessment Summary
    projectName: '',
    assessmentType: '',
    assessmentCategory: '',
    assessmentYear: '',
    pciVersion: '',
    assessmentPeriod: '',
    auditStart: '',
    auditEnd: '',
    reportDate: '',
    auditStatus: 'Choose',
    certificateIssue: '',
    certificateExpiry: '',
    certificateNumber: '',
    nextAudit: '',

    // Assessor Information
    qsaName: '',
    qsaLicense: '',
    reviewerName: '',

    // Scope and Environment
    scope: '',
    locationScope: '',

    // Compliance Results
    complianceStatus: '',
    compensatingControls: 'Choose', // default dropdown
    customApproach: 'Choose',        // default dropdown
    nonConformities: '',
    identified: '',
    remediationDate: '',
    revalidationDate: ''
  };


  saveAndContinue(form: NgForm) {
    // 1️⃣ You can handle form saving here
    if (form.valid) {
      console.log('Form data:', form.value);

    }


    const currentIndex = this.tabs.indexOf(this.activeTab);
    const nextIndex = currentIndex + 1;

    if (nextIndex < this.tabs.length) {
      this.activeTab = this.tabs[nextIndex];
    } else {
      console.log('All steps completed');
    }
  }


  switchTab(tabName: string) {
    this.activeTab = tabName;
  }
  goBack() {
    const currentIndex = this.tabs.indexOf(this.activeTab);
    const previousIndex = currentIndex - 1;

    if (previousIndex >= 0) {
      this.activeTab = this.tabs[previousIndex];
    } else {
      console.log('Already on the first tab');
    }
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Client Form Submitted:', this.client);
      alert('Form submitted successfully!');
      form.resetForm({
        auditStatus: 'In To Do', // reset with default value
        compensatingControls: 'Choose',
        customApproach: 'Choose'
      });
    } else {
      alert('Please fill all required fields.');
    }
  }
}
