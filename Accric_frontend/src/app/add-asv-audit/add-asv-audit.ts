import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-asv-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-asv-audit.html',
  styleUrl: './add-asv-audit.css',
})
export class AddAsvAudit {
  showErrors = false;
  
  asvData = {
    numberOfIPs: null as number | null,  // Changed to number type
    IPDetails: '',
    associatedOrganization: '', //legalEntityName
    associatedApplication: ''  //AssessmentName
  };

  onSubmit(form: NgForm) {
    if (form.valid) {
      // Reset form after successful submission
      this.resetForm(form);
      
      // Show success message (you can implement a toast/notification)
      alert('ASV Audit submitted successfully!');
    } else {
      this.showErrors = true;
      
      // Mark all fields as touched to show errors
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });
    }
  }

  resetForm(form: NgForm) {
    form.resetForm();
    this.asvData = {
      numberOfIPs: null,
      IPDetails: '',
      associatedOrganization: '',
      associatedApplication: ''
    };
    this.showErrors = false;
  }

  // Optional: Method to handle form reset
  onReset(form: NgForm) {
    this.resetForm(form);
  }

  // Optional: Method to handle input changes
  onInputChange(field: string, value: any) {
    console.log(`${field} changed to:`, value);
    
    // You can add validation logic here if needed
    if (field === 'numberOfIPs' && value < 1) {
      // Reset to minimum value
      this.asvData.numberOfIPs = 1;
    }
  }

  // Optional: Get form data for debugging
  getFormData() {
    return {
      ...this.asvData,
      isValid: this.isFormValid()
    };
  }

  // Optional: Check if form is valid
  isFormValid(): boolean {
    return (
      this.asvData.numberOfIPs !== null &&
      this.asvData.numberOfIPs > 0 &&
      !!this.asvData.associatedOrganization &&
      !!this.asvData.associatedApplication
    );
  }
}