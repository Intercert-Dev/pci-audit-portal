import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-audit',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-audit.html',
  styleUrl: './add-audit.css',
})
export class AddAudit {
  activeTab = 'assessment-summary';
  showErrors = false;
  
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
    locationOfScope: ''
  };

  switchTab(tab: string, form: any) {
    if (form.valid) {
      this.activeTab = tab;
    } else {
      this.showErrors = true;
    }
  }

  saveAndContinue(form: any) {
    if (form.valid) {
      if (this.activeTab === 'assessment-summary') {
        this.activeTab = 'assessor-info';
      } else if (this.activeTab === 'assessor-info') {
        this.activeTab = 'scope-env';
      }
    } else {
      this.showErrors = true;
    }
  }

  goBack() {
    if (this.activeTab === 'assessor-info') {
      this.activeTab = 'assessment-summary';
    } else if (this.activeTab === 'scope-env') {
      this.activeTab = 'assessor-info';
    }
  }

  onSubmit(form: any) {
    if (form.valid) {
      console.log('Form submitted:', this.auditData);
    } else {
      this.showErrors = true;
    }
  }
}