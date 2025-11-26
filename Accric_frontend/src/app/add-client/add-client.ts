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

  activeTab: string = 'client-profile';
  showErrors = false;

   previousReportFile: File | null = null;
  currentReportFile: File | null = null;

  previousReportUrl: string | null = null;
  currentReportUrl: string | null = null;

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
    technicalContact: '',
    iso: '',
    clientSignoff: '',

    assessmentName: '',
    assessmentType: '',
    assessmentCategory: '',
    auditStart: '',
    auditEnd: ''
  };

  // Required Fields for each tab
  tabRequiredFields: { [key: string]: string[] } = {
    "client-profile": [
      "legalEntityName", "country", "state", "city", "street", "zipCode", "typeOfBusiness"
    ],
    "primary-contacts": [
      "primaryName", "primaryDesignation", "primaryEmail", "primaryPhone", "clientSignoff"
    ],
    "assessment-summary": [
      "auditStart", "auditEnd"
    ],
    "assessor-info": [],
    "scope-env": [],
    "compliance-results": []
  };


  onUpload(type: 'previous' | 'current') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

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

    if (!url) {
      alert('No file uploaded to preview.');
      return;
    }

    window.open(url, '_blank');
  }

   onDownload(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;

    if (!file) {
      alert('No file uploaded to download.');
      return;
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
  }

  validateCurrentTab(form: NgForm): boolean {
    const requiredFields: string[] = this.tabRequiredFields[this.activeTab];
    let isValid = true;

    requiredFields.forEach((fieldName: string) => {
      const control = form.controls[fieldName];

      if (control && control.invalid) {
        control.markAsTouched();   // FIXED: No .control
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
    if (currentIndex > 0) {
      this.activeTab = this.tabs[currentIndex - 1];
    }
  }

  onSubmit(form: NgForm) {
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      return;
    }

    if (form.valid) {
      console.log("Submitted Data:", this.clientData);
      alert("Form Submitted Successfully!");
      form.resetForm();
    }
  }
}
