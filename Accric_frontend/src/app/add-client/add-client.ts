import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './add-client.html',
  styleUrls: ['./add-client.css']
})
export class AddClient {
  // Define all form fields with sensible defaults
  
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
