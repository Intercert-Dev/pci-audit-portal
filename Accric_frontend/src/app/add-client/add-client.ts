import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-client.html',
  styleUrls: ['./add-client.css']
})
export class AddClient {
  @ViewChild('clientForm') clientForm!: NgForm;

  activeTab: string = 'client-profile';
  showErrors = false;

  constructor(private http: HttpClient) { }

  tabs = [
    'client-profile',
    'primary-contacts'
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
    informationSecurityOfficer: '',
    clientSignoff: '',
    clientStatus: ''
  };

  tabRequiredFields: { [key: string]: string[] } = {
    "client-profile": ["legalEntityName", "country", "state", "city", "street", "zipCode", "typeOfBusiness"],
    "primary-contacts": ["primaryName", "primaryDesignation", "primaryEmail", "primaryPhone", "clientSignoff"]
  };

  formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  private buildPayload(): { [key: string]: any } {
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
      technical_contacts: this.clientData.technicalContact,
      information_security_officer: this.clientData.informationSecurityOfficer,
      client_signoff_authority: this.clientData.clientSignoff,
      client_status: this.clientData.clientStatus
    };
  }

  private sendClientDataToAPI(formData: FormData) {
    const url = 'http://pci.accric.com/api/auth/create-client';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    this.http.post(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Client created successfully!');
        // Reset form or navigate away
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to create client. Check console for details.');
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
        if (this.clientForm && !this.validateCurrentTab(this.clientForm)) {
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
    this.sendClientDataToAPI(formData);
  }
}