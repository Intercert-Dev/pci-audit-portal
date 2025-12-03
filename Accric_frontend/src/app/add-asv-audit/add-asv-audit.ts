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
    associatedAudit: '',  // Keep as string since input type="number" but value might be string
    associatedApplication: ''
  };

  onSubmit(form: NgForm) {
    if (form.valid) {
      // Submit logic
      console.log('ASV Audit submitted:', this.asvData);
      
      // Here you would typically make an API call
      // For example:
      // this.asvService.submitAudit(this.asvData).subscribe(
      //   response => console.log('Success:', response),
      //   error => console.error('Error:', error)
      // );
      
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
      associatedAudit: '',
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
      !!this.asvData.associatedAudit &&
      !!this.asvData.associatedApplication
    );
  }
}