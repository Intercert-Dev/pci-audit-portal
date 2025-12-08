import { ChangeDetectorRef, Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

export interface QSA {
  qsa_id: string;
  qsa_name: string;
  qsa_email: string;
  certification_number: string;
  signature: string | null;
}

@Component({
  selector: 'app-qsa-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qsa-list.html',
  styleUrl: './qsa-list.css',
})
export class QsaList implements OnInit, OnDestroy {
  qsaList: QSA[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // EDIT POPUP STATE
  showEditPopup = false;
  editModel: QSA = {
    qsa_id: '',
    qsa_name: '',
    qsa_email: '',
    certification_number: '',
    signature: null
  };
  newSignatureFile: File | null = null;
  signaturePreview: string | null = null;

  // Store object URLs for cleanup
  private objectUrls: string[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router, private zone: NgZone) { }

  ngOnInit(): void {
    this.loadQsaList();
  }

  ngOnDestroy(): void {
    this.cleanupObjectUrls();
  }

  private cleanupObjectUrls(): void {
    this.objectUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.objectUrls = [];
  }

  loadQsaList() {
    const url = 'http://pci.accric.com/api/auth/qsa-list';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        console.log("List of QSA", res.data);
        this.qsaList = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch QSA list:', err);
        this.errorMessage = 'Failed to load QSA list';
        this.cdr.detectChanges();
      }
    });
  }

  removeNewSignature() {
    if (this.signaturePreview && this.signaturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.signaturePreview);
      const index = this.objectUrls.indexOf(this.signaturePreview);
      if (index > -1) {
        this.objectUrls.splice(index, 1);
      }
    }

    this.newSignatureFile = null;
    this.signaturePreview = null;

    const fileInput = document.getElementById('signatureUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
  }

  editQsa(qsa: QSA): void {
    // Cleanup previous preview if exists
    if (this.signaturePreview && this.signaturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.signaturePreview);
      const index = this.objectUrls.indexOf(this.signaturePreview);
      if (index > -1) {
        this.objectUrls.splice(index, 1);
      }
    }

    this.editModel = { ...qsa };
    this.signaturePreview = qsa.signature || null;
    this.newSignatureFile = null;
    this.showEditPopup = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.closeEditPopup();
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  onSignatureUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (this.isValidImageType(file)) {
      this.handleFileSelectionFast(file);
    } else {
      alert('Please upload only PNG, JPG, or SVG files.');
      event.target.value = '';
    }
  }

  isValidImageType(file: File): boolean {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    return validTypes.includes(file.type);
  }

  handleFileSelectionFast(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    // Cleanup previous preview
    if (this.signaturePreview && this.signaturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.signaturePreview);
      const index = this.objectUrls.indexOf(this.signaturePreview);
      if (index > -1) {
        this.objectUrls.splice(index, 1);
      }
    }

    this.newSignatureFile = file;
    const objectUrl = URL.createObjectURL(file);
    this.signaturePreview = objectUrl;
    this.objectUrls.push(objectUrl);
    this.cdr.detectChanges();

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 100);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeCurrentSignature() {
    this.editModel.signature = null;
    this.signaturePreview = null;
    this.cdr.detectChanges();
  }

  saveEdit(): void {
    if (!this.editModel.qsa_id) {
      this.errorMessage = 'Invalid QSA ID';
      this.cdr.detectChanges();
      return;
    }

    // Validation
    if (!this.editModel.qsa_name.trim()) {
      this.errorMessage = 'QSA Name is required';
      this.cdr.detectChanges();
      return;
    }

    if (!this.editModel.qsa_email.trim()) {
      this.errorMessage = 'Email is required';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidEmail(this.editModel.qsa_email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();

    // 1. ALWAYS send these text fields
    formData.append('qsa_name', this.editModel.qsa_name.trim());
    formData.append('qsa_email', this.editModel.qsa_email.trim());
    formData.append('certification_number', this.editModel.certification_number || '');

    // 2. Handle signature fields based on scenario:
    if (this.newSignatureFile) {
      console.log('Uploading new signature file');
      formData.append('signature', this.newSignatureFile);
      formData.append('old_signature', this.editModel.signature || '');
    }
    else if (this.editModel.signature === null) {
      formData.append('signature', '');
      formData.append('old_signature', '');
    }
    else {
      formData.append('signature', '');
      formData.append('old_signature', this.editModel.signature);
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const url = `http://pci.accric.com/api/auth/update-qsa/${this.editModel.qsa_id}`;
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.put<any>(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('Update response:', res);

        if (res.success) {
          this.successMessage = 'QSA updated successfully!';
          this.router.navigate(['/qsa-list']);
            this.closeEditPopup();
            this.loadQsaList();   // <<< Fetch updated list instantly
            this.cdr.detectChanges();
        } else {
          this.errorMessage = res.message || 'Failed to update QSA';
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  // Helper to update QSA in the local list
  private updateQsaInList(updatedQsa: QSA): void {
    const index = this.qsaList.findIndex(qsa => qsa.qsa_id === updatedQsa.qsa_id);

    if (index !== -1) {
      // Update the existing QSA
      this.qsaList[index] = { ...updatedQsa };
    } else {
      // Add new QSA if not found (should not happen)
      this.qsaList.push({ ...updatedQsa });
    }

    // Trigger change detection by creating a new reference
    this.qsaList = [...this.qsaList];
    console.log('QSA list updated:', this.qsaList);
  }

  // Helper to close edit popup with cleanup
  private closeEditPopup(): void {
    // Close popup FIRST (this is the key change)
    this.showEditPopup = false;

    // Then cleanup
    if (this.signaturePreview && this.signaturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.signaturePreview);
      const index = this.objectUrls.indexOf(this.signaturePreview);
      if (index > -1) {
        this.objectUrls.splice(index, 1);
      }
    }

    this.editModel = {
      qsa_id: '',
      qsa_name: '',
      qsa_email: '',
      certification_number: '',
      signature: null
    };
    this.newSignatureFile = null;
    this.signaturePreview = null;
    this.errorMessage = '';
  }

  // Helper to debug FormData
  private debugFormData(formData: FormData): void {
    const entries: Array<{ key: string, value: string }> = [];

    formData.forEach((value, key) => {
      let displayValue: string;

      if (value instanceof File) {
        displayValue = `File: "${value.name}" (${value.size} bytes, ${value.type})`;
      } else {
        displayValue = `String: "${value}"`;
      }

      entries.push({ key, value: displayValue });
    });

    entries.sort((a, b) => a.key.localeCompare(b.key));

    console.log('FormData contents:');
    entries.forEach(entry => {
      console.log(`   ${entry.key}: ${entry.value}`);
    });
  }

  private getErrorMessage(err: any): string {
    if (err.error && err.error.message) {
      return err.error.message;
    }
    return 'Failed to update QSA. Please try again.';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  triggerFileInput() {
    const fileInput = document.getElementById('signatureUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
}