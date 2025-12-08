import { ChangeDetectorRef, Component, OnInit, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

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
  
  // Performance monitoring
  private performance = window.performance;
  private requestStartTime: number = 0;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private zone = inject(NgZone);

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

  async loadQsaList() {
    const url = 'http://pci.accric.com/api/auth/qsa-list';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      const startTime = this.performance.now();
      const res = await firstValueFrom(this.http.get<any>(url, { headers }));
      const endTime = this.performance.now();
      console.log(`QSA list loaded in ${(endTime - startTime).toFixed(2)}ms`);
      
      this.qsaList = res.data || [];
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to fetch QSA list:', err);
      this.errorMessage = 'Failed to load QSA list';
      this.cdr.detectChanges();
    }
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

  async saveEdit(): Promise<void> {
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
    formData.append('qsa_name', this.editModel.qsa_name.trim());
    formData.append('qsa_email', this.editModel.qsa_email.trim());
    formData.append('certification_number', this.editModel.certification_number || '');

    // Handle signature fields
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

    this.requestStartTime = this.performance.now();
    
    // OPTIMIZATION 1: Immediate UI update
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // OPTIMIZATION 2: Update local list immediately for instant feedback
    const updatedQsa: QSA = {
      ...this.editModel,
      // Keep existing signature if not changed
      signature: this.newSignatureFile ? 'pending' : this.editModel.signature
    };
    
    const index = this.qsaList.findIndex(q => q.qsa_id === updatedQsa.qsa_id);
    if (index !== -1) {
      this.qsaList[index] = updatedQsa;
      this.qsaList = [...this.qsaList]; // Trigger change detection
    }
    
    this.cdr.detectChanges();

    // OPTIMIZATION 3: Close popup immediately for better UX
    this.showEditPopup = false;
    this.cleanupEditPopup();

    // OPTIMIZATION 4: Navigate immediately (no waiting for response)
    this.zone.run(() => {
      this.router.navigate(['/qsa-list'], {
        queryParams: { 
          refresh: Date.now(), 
          updated: this.editModel.qsa_id 
        }
      });
    });

    // OPTIMIZATION 5: Send request in background with timeout
    this.sendUpdateRequest(formData);
  }

  private async sendUpdateRequest(formData: FormData): Promise<void> {
    const url = `http://pci.accric.com/api/auth/update-qsa/${this.editModel.qsa_id}`;
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      // OPTIMIZATION 6: Use fetch API with abort controller for better control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const endTime = this.performance.now();
      const responseTime = (endTime - this.requestStartTime).toFixed(2);
      
      const res = await response.json();
      
      if (res.success) {
        // OPTIMIZATION 7: Show success message but don't reload entire list
        this.successMessage = `QSA updated successfully! (${responseTime}ms)`;
        
        // Update the specific item with actual data from response
        if (res.data) {
          const updatedIndex = this.qsaList.findIndex(q => q.qsa_id === res.data.qsa_id);
          if (updatedIndex !== -1) {
            this.qsaList[updatedIndex] = res.data;
            this.qsaList = [...this.qsaList];
          }
        }
      } else {
        this.errorMessage = res.message || 'Failed to update QSA';
        // Revert changes if failed
        this.loadQsaList();
      }
      
      this.isLoading = false;
      this.cdr.detectChanges();
      
    } catch (err: any) {
      const endTime = this.performance.now();
      console.error(`Update failed after ${(endTime - this.requestStartTime).toFixed(2)}ms:`, err);
      
      this.isLoading = false;
      this.errorMessage = err.name === 'AbortError' 
        ? 'Request timeout. Please try again.' 
        : 'Failed to update QSA. Please try again.';
      
      // Revert to original data on error
      this.loadQsaList();
      this.cdr.detectChanges();
    }
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