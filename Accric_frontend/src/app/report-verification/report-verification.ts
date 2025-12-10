import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface LegalEntity {
  id: number;
  name: string;
}

@Component({
  selector: 'app-report-verification',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-verification.html',
  styleUrls: ['./report-verification.css'],
})
export class ReportVerification {
  previousReportFile: File | null = null;
  currentReportFile: File | null = null;
  
  // Legal Entity Search Properties
  legalEntitySearch: string = '';
  filteredLegalEntities: LegalEntity[] = [];
  showLegalEntityDropdown: boolean = false;
  selectedLegalEntityId: number | null = null;
  legalEntities: LegalEntity[] = [
    { id: 1, name: 'ABC Corporation Ltd.' },
    { id: 2, name: 'XYZ Technologies Inc.' },
    { id: 3, name: 'Global Solutions Group' },
    { id: 4, name: 'Innovate Digital Systems' },
    { id: 5, name: 'Secure Network Partners' },
    { id: 6, name: 'Data Analytics International' },
    { id: 7, name: 'Cloud Computing Experts' },
    { id: 8, name: 'Financial Services Group' },
    { id: 9, name: 'Healthcare IT Solutions' },
    { id: 10, name: 'Retail Systems Inc.' },
  ];
  
  reportData = {
    verificationNotes: '',
    verificationStatus: '',
    verifiedBy: '',
    verificationDate: ''
  };

  constructor() {
    // Initialize filtered list with all entities
    this.filteredLegalEntities = [...this.legalEntities];
  }

  // Legal Entity Search Methods
  onLegalEntitySearch() {
    const searchTerm = this.legalEntitySearch.toLowerCase().trim();
    
    if (searchTerm === '') {
      this.filteredLegalEntities = [...this.legalEntities];
    } else {
      this.filteredLegalEntities = this.legalEntities.filter(entity =>
        entity.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  selectLegalEntity(entity: LegalEntity) {
    this.legalEntitySearch = entity.name;
    this.selectedLegalEntityId = entity.id;
    this.showLegalEntityDropdown = false;
  }

  onLegalEntityBlur() {
    // Use setTimeout to allow click events to fire before hiding dropdown
    setTimeout(() => {
      this.showLegalEntityDropdown = false;
      
      // If search doesn't match any entity, reset selection
      if (this.selectedLegalEntityId !== null) {
        const selectedEntity = this.legalEntities.find(
          entity => entity.id === this.selectedLegalEntityId
        );
        
        if (selectedEntity && this.legalEntitySearch !== selectedEntity.name) {
          this.selectedLegalEntityId = null;
        }
      }
    }, 200);
  }

  // File Upload Methods
  onUpload(type: 'previous' | 'current') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
    input.multiple = false;
    
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        // Validate file type
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/png',
          'image/jpeg',
          'image/jpg'
        ];
        
        if (!validTypes.includes(file.type)) {
          alert('Please upload a valid file (PDF, Word, Excel, or Image)');
          return;
        }
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
          alert('File size should not exceed 10MB');
          return;
        }
        
        if (type === 'previous') {
          this.previousReportFile = file;
        } else {
          this.currentReportFile = file;
        }
        
        console.log(`${type} report uploaded:`, file.name);
      }
    };
    
    input.click();
  }

  onPreview(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;
    
    if (!file) {
      alert(`No ${type} report file uploaded`);
      return;
    }
    
    const url = URL.createObjectURL(file);
    
    // For PDF files, open in new tab
    if (file.type === 'application/pdf') {
      window.open(url, '_blank');
    } else {
      // For other file types, create a download link
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Clean up URL object after some time
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  onDownload(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;
    
    if (!file) {
      alert(`No ${type} report file uploaded`);
      return;
    }
    
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log(`${type} report downloaded:`, file.name);
  }

  onSubmit(form: NgForm) {
    // Validate legal entity selection
    if (!this.selectedLegalEntityId) {
      alert('Please select a legal entity');
      return;
    }
    
    // Validate at least one report is uploaded
    if (!this.previousReportFile && !this.currentReportFile) {
      alert('Please upload at least one report file');
      return;
    }
    
    if (form.valid) {
      // Prepare submission data
      const submissionData = {
        legalEntityId: this.selectedLegalEntityId,
        legalEntityName: this.legalEntitySearch,
        previousReport: this.previousReportFile ? {
          name: this.previousReportFile.name,
          size: this.previousReportFile.size,
          type: this.previousReportFile.type
        } : null,
        currentReport: this.currentReportFile ? {
          name: this.currentReportFile.name,
          size: this.currentReportFile.size,
          type: this.currentReportFile.type
        } : null,
        ...this.reportData
      };
      
      console.log('Report verification submitted:', submissionData);
      
      // Here you would typically send the data to a backend service
      // this.verificationService.submitReport(submissionData).subscribe(...);
      
      // Reset form after successful submission
      this.resetForm(form);
      
      alert('Report verification submitted successfully!');
    } else {
      alert('Please fill all required fields correctly');
    }
  }

  resetForm(form: NgForm) {
    form.resetForm();
    this.legalEntitySearch = '';
    this.selectedLegalEntityId = null;
    this.previousReportFile = null;
    this.currentReportFile = null;
    this.filteredLegalEntities = [...this.legalEntities];
    this.reportData = {
      verificationNotes: '',
      verificationStatus: '',
      verifiedBy: '',
      verificationDate: ''
    };
  }

  // Helper method to get selected legal entity name
  getSelectedLegalEntityName(): string {
    if (!this.selectedLegalEntityId) return '';
    const entity = this.legalEntities.find(e => e.id === this.selectedLegalEntityId);
    return entity ? entity.name : '';
  }
}