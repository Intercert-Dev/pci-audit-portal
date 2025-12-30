import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

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
    const url = 'https://pci.accric.com/api/auth/qsa-list';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
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

    // Prepare form data
    const formData = new FormData();
    formData.append('qsa_name', this.editModel.qsa_name.trim());
    formData.append('qsa_email', this.editModel.qsa_email.trim());
    formData.append('certification_number', this.editModel.certification_number || '');

    if (this.newSignatureFile) {
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

    // Store the qsa_id before cleaning up
    const qsaIdToUpdate = this.editModel.qsa_id;
    
    // =============================================
    // ⚡⚡⚡ INSTANT ACTIONS (within 50ms) ⚡⚡⚡
    // =============================================
    
    // 1. INSTANTLY close popup
    this.showEditPopup = false;
    this.cleanupEditPopup();
    
    // 2. INSTANTLY show loading indicator
    this.isLoading = true;
    this.successMessage = 'Saving changes...';
    this.errorMessage = '';
    
    // 3. INSTANTLY navigate (no waiting!)
    setTimeout(() => {
      this.router.navigate(['/qsa-list'], {
        queryParams: { 
          refresh: Date.now(),
          updating: qsaIdToUpdate
        }
      });
    }, 50); // 50ms delay to ensure smooth transition
    
    this.cdr.detectChanges();
    // =============================================
    
    // Send API request in background (doesn't block UI)
    this.sendUpdateRequest(formData, qsaIdToUpdate);
  }

  private sendUpdateRequest(formData: FormData, qsaId: string): void {
    const url = `https://pci.accric.com/api/auth/update-qsa/${qsaId}`;
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.put<any>(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('Update response:', res);

        if (res.success) {
          // Update local list with server data
          const updatedIndex = this.qsaList.findIndex(q => q.qsa_id === res.data.qsa_id);
          if (updatedIndex !== -1) {
            this.qsaList[updatedIndex] = res.data;
            this.qsaList = [...this.qsaList];
          }
          
          this.successMessage = '✅ QSA updated successfully!';
          console.log('Update successful:', res.data);
        } else {
          this.errorMessage = res.message || 'Failed to update QSA';
          console.error('Update failed:', res);
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Auto-clear success message after 3 seconds
        if (res.success) {
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        }
      },
      error: (err) => {
        console.error('Update error:', err);
        this.errorMessage = this.getErrorMessage(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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

  private closeEditPopup(): void {
    this.showEditPopup = false;
    this.cleanupEditPopup();
  }

  private cleanupEditPopup(): void {
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