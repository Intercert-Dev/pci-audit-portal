import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-qsa-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './qsa-add.html',
  styleUrls: ['./qsa-add.css']
})
export class QsaAdd {

  qsaForm: FormGroup;
  selectedSignatureFile: File | null = null;
  signaturePreview: string | null = null;
  signatureFileName = '';
  isImage = true;

  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize form with your frontend field names
    this.qsaForm = this.fb.group({
      qsaName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      certificationNumber: ['', Validators.required],
      signature: ['', Validators.required]
    });
  }

  // Getter for easy access to form controls
  get f(): { [key: string]: FormControl } {
    return this.qsaForm.controls as { [key: string]: FormControl };
  }

  // Handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedSignatureFile = file;
    this.signatureFileName = file.name;
    this.qsaForm.patchValue({ signature: file });

    this.isImage = file.type.startsWith('image/');

    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        this.signaturePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.signaturePreview = null;
      this.cdr.detectChanges();
    }
  }

  removeFile() {
    this.selectedSignatureFile = null;
    this.signaturePreview = null;
    this.signatureFileName = '';
    this.qsaForm.patchValue({ signature: '' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    this.cdr.detectChanges();
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    // Validate form
    if (this.qsaForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      this.markFormGroupTouched(this.qsaForm);
      return;
    }

    // Validate file
    if (!this.selectedSignatureFile) {
      this.errorMessage = 'Please select a signature file';
      return;
    }

    // Get JWT token
    const token = localStorage.getItem('jwt');
    if (!token) {
      this.errorMessage = 'Authentication token not found. Please login again.';
      return;
    }

    // Prepare FormData with correct backend field names
    const formData = new FormData();
    
    // Map frontend field names to backend field names:
    // qsaName -> qsa_name
    // email -> qsa_email
    // certificationNumber -> certification_number
    formData.append('qsa_name', this.qsaForm.value.qsaName);
    formData.append('qsa_email', this.qsaForm.value.email); // Changed from 'email' to 'qsa_email'
    formData.append('certification_number', this.qsaForm.value.certificationNumber);
    formData.append('signature', this.selectedSignatureFile, this.selectedSignatureFile.name);

    // Debug: Log what's being sent
    console.log('Form values:', {
      qsa_name: this.qsaForm.value.qsaName,
      qsa_email: this.qsaForm.value.email,
      certification_number: this.qsaForm.value.certificationNumber,
      signature: this.selectedSignatureFile?.name
    });

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.isLoading = true;

    const apiUrl = 'http://pci.accric.com/api/auth/create-qsa';
    
    this.http.post(apiUrl, formData, { headers }).subscribe({
      next: (response: any) => {
        console.log('QSA created successfully:', response);
        
        // Check API response structure
        if (response.success) {
          this.successMessage = response.message || 'QSA added successfully!';
        } else {
          this.errorMessage = response.message || 'QSA added but with warnings.';
        }
        
        this.isLoading = false;
        
        // Reset form only on successful creation
        this.resetForm();
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating QSA:', error);
        
        this.isLoading = false;
        
        // Better error handling with specific messages
        if (error.status === 400) {
          // Bad Request - usually validation errors from backend
          if (error.error && error.error.errors) {
            // Handle validation errors from Laravel/backend
            const backendErrors = error.error.errors;
            let errorMessages = [];
            
            if (backendErrors.qsa_name) errorMessages.push(`Name: ${backendErrors.qsa_name.join(', ')}`);
            if (backendErrors.qsa_email) errorMessages.push(`Email: ${backendErrors.qsa_email.join(', ')}`);
            if (backendErrors.certification_number) errorMessages.push(`Certification Number: ${backendErrors.certification_number.join(', ')}`);
            if (backendErrors.signature) errorMessages.push(`Signature: ${backendErrors.signature.join(', ')}`);
            
            this.errorMessage = errorMessages.join(' | ');
          } else {
            this.errorMessage = error.error?.message || 'Validation failed. Please check your inputs.';
          }
        } else if (error.status === 422) {
          // Unprocessable Entity - Laravel validation errors
          this.errorMessage = 'Validation error. Please check all fields are correct.';
          if (error.error && error.error.errors) {
            console.log('Validation errors:', error.error.errors);
          }
        } else if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Failed to add QSA. Please check your network and try again.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Reset form completely
  private resetForm() {
    this.qsaForm.reset();
    this.removeFile();
    
    // Reset validation states
    Object.keys(this.qsaForm.controls).forEach(key => {
      const control = this.qsaForm.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }
}