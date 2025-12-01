import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
    // Initialize form
    this.qsaForm = this.fb.group({
      qsaName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      certificationNumber: ['', Validators.required],
      signature: ['', Validators.required]
    });
  }

  // Getter for easy access to form controls
  get f() {
    return this.qsaForm.controls;
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
      reader.onload = () => this.signaturePreview = reader.result as string;
      reader.readAsDataURL(file);
    } else {
      this.signaturePreview = null;
    }
  }

  // Remove selected file
  removeFile() {
    this.selectedSignatureFile = null;
    this.signaturePreview = null;
    this.signatureFileName = '';
    this.qsaForm.patchValue({ signature: '' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Submit form
  onSubmit() {
    if (this.qsaForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      this.successMessage = '';
      return;
    }

    const payload = {
      qsa_name: this.qsaForm.value.qsaName,
      email: this.qsaForm.value.email,
      certification_number: this.qsaForm.value.certificationNumber,
      signature: this.selectedSignatureFile
    };

    console.log('QSA added:', payload);

    this.successMessage = 'QSA added successfully!';
    this.errorMessage = '';

    // Reset form
    this.qsaForm.reset();
    this.removeFile();
  }
}
