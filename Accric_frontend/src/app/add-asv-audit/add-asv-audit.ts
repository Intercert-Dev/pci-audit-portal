import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

interface LegalEntity {
  id: number;
  name: string;
}

interface Audit {
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-asv-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-asv-audit.html',
  styleUrl: './add-asv-audit.css',
})
export class AddAsvAudit {
  showErrors = false;
  
  // Main form data
  asvData = {
    numberOfIPs: null as number | null,
    IPDetails: '',
    associatedOrganization: '',
    associatedApplication: '',
    legalEntityName: '',
    audit: '',
  };

  // Legal entity search properties
  legalEntitySearch: string = '';
  showLegalEntityDropdown: boolean = false;
  selectedLegalEntityId: number | null = null;
  
  // Audit search properties
  auditSearch: string = '';
  showAuditDropdown: boolean = false;
  selectedAuditId: number | null = null;
  
  // Mock data for legal entities
  legalEntities: LegalEntity[] = [

  ];
  
  // Mock data for audits
  auditEntities: Audit[] = [
  ];
  
  filteredLegalEntities: LegalEntity[] = [];
  filteredAudits: Audit[] = [];

  constructor() {
    // Initialize filtered lists
    this.filteredLegalEntities = [...this.legalEntities];
    this.filteredAudits = [...this.auditEntities];
  }

  // Legal entity search handler
  onLegalEntitySearch() {
    const searchTerm = this.legalEntitySearch.toLowerCase();
    
    if (searchTerm.trim() === '') {
      this.filteredLegalEntities = [...this.legalEntities];
    } else {
      this.filteredLegalEntities = this.legalEntities.filter(entity =>
        entity.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Audit search handler
  onAuditSearch() {
    const searchTerm = this.auditSearch.toLowerCase();
    
    if (searchTerm.trim() === '') {
      this.filteredAudits = [...this.auditEntities];
    } else {
      this.filteredAudits = this.auditEntities.filter(audit =>
        audit.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Select a legal entity
  selectLegalEntity(entity: LegalEntity) {
    this.selectedLegalEntityId = entity.id;
    this.legalEntitySearch = entity.name;
    this.asvData.legalEntityName = entity.name;
    this.showLegalEntityDropdown = false;
  }

  // Select an audit
  selectAudit(entity: Audit) {
    this.selectedAuditId = entity.id;
    this.auditSearch = entity.name;
    this.asvData.audit = entity.name;
    this.showAuditDropdown = false;
  }

  // Handle blur event for legal entity search
  onLegalEntityBlur() {
    setTimeout(() => {
      this.showLegalEntityDropdown = false;
      
      if (this.legalEntitySearch && !this.selectedLegalEntityId) {
        const matchedEntity = this.legalEntities.find(entity => 
          entity.name.toLowerCase() === this.legalEntitySearch.toLowerCase()
        );
        
        if (matchedEntity) {
          this.selectedLegalEntityId = matchedEntity.id;
          this.asvData.legalEntityName = matchedEntity.name;
        } else {
          this.selectedLegalEntityId = null;
          this.asvData.legalEntityName = this.legalEntitySearch;
        }
      }
    }, 200);
  }

  // Handle blur event for audit search
  onAuditBlur() {
    setTimeout(() => {
      this.showAuditDropdown = false;
      
      if (this.auditSearch && !this.selectedAuditId) {
        const matchedAudit = this.auditEntities.find(audit => 
          audit.name.toLowerCase() === this.auditSearch.toLowerCase()
        );
        
        if (matchedAudit) {
          this.selectedAuditId = matchedAudit.id;
          this.asvData.audit = matchedAudit.name;
        } else {
          this.selectedAuditId = null;
          this.asvData.audit = this.auditSearch;
        }
      }
    }, 200);
  }

  // Form submission
  onSubmit(form: NgForm) {
    if (form.valid && this.isFormValid()) {
      const formData = {
        ...this.asvData,
        legalEntityId: this.selectedLegalEntityId,
        auditId: this.selectedAuditId,
        numberOfIPs: this.asvData.numberOfIPs || 0,
      };
      
      console.log('Form submitted:', formData);
      
      // Here you would typically send data to a backend service
      // For now, save to localStorage as an example
      try {
        localStorage.setItem('asvAuditData', JSON.stringify(formData));
        this.resetForm(form);
        alert('ASV Audit submitted successfully!');
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
      }
    } else {
      this.showErrors = true;
      
      // Mark all fields as touched to show errors
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        control.markAsTouched();
      });
      
      // Check which fields are invalid
      if (!this.asvData.numberOfIPs || this.asvData.numberOfIPs < 1) {
        alert('Please enter a valid number of IPs (minimum 1)');
      } else if (!this.asvData.associatedOrganization) {
        alert('Associated Organization is required');
      } else if (!this.asvData.associatedApplication) {
        alert('Associated Application is required');
      } else if (!this.auditSearch.trim()) {
        alert('PCI Audit is required');
      } else if (!this.legalEntitySearch.trim()) {
        alert('Legal Entity Name is required');
      }
    }
  }

  resetForm(form: NgForm) {
    form.resetForm();
    this.asvData = {
      numberOfIPs: null,
      IPDetails: '',
      associatedOrganization: '',
      associatedApplication: '',
      legalEntityName: '',
      audit: '',
    };
    this.legalEntitySearch = '';
    this.auditSearch = '';
    this.selectedLegalEntityId = null;
    this.selectedAuditId = null;
    this.filteredLegalEntities = [...this.legalEntities];
    this.filteredAudits = [...this.auditEntities];
    this.showLegalEntityDropdown = false;
    this.showAuditDropdown = false;
    this.showErrors = false;
  }

  onReset(form: NgForm) {
    this.resetForm(form);
  }

  onInputChange(field: string, value: any) {
    console.log(`${field} changed to:`, value);
    
    if (field === 'numberOfIPs' && value < 1) {
      this.asvData.numberOfIPs = 1;
    }
    
    if (field === 'legalEntityName' && value !== this.legalEntitySearch) {
      this.legalEntitySearch = value;
      this.selectedLegalEntityId = null;
    }
    
    if (field === 'audit' && value !== this.auditSearch) {
      this.auditSearch = value;
      this.selectedAuditId = null;
    }
  }

  getFormData() {
    return {
      ...this.asvData,
      legalEntityId: this.selectedLegalEntityId,
      auditId: this.selectedAuditId,
      legalEntitySearch: this.legalEntitySearch,
      auditSearch: this.auditSearch,
      isValid: this.isFormValid()
    };
  }

  isFormValid(): boolean {
    return (
      this.asvData.numberOfIPs !== null &&
      this.asvData.numberOfIPs > 0 &&
      !!this.asvData.associatedOrganization.trim() &&
      !!this.asvData.associatedApplication.trim() &&
      !!this.legalEntitySearch.trim() &&
      !!this.auditSearch.trim()
    );
  }

  // Additional helper methods
  clearLegalEntitySearch() {
    this.legalEntitySearch = '';
    this.selectedLegalEntityId = null;
    this.asvData.legalEntityName = '';
    this.filteredLegalEntities = [...this.legalEntities];
    this.showLegalEntityDropdown = true;
  }

  clearAuditSearch() {
    this.auditSearch = '';
    this.selectedAuditId = null;
    this.asvData.audit = '';
    this.filteredAudits = [...this.auditEntities];
    this.showAuditDropdown = true;
  }

  // Get selected legal entity details
  getSelectedLegalEntity(): LegalEntity | undefined {
    if (!this.selectedLegalEntityId) return undefined;
    return this.legalEntities.find(entity => entity.id === this.selectedLegalEntityId);
  }

  // Get selected audit details
  getSelectedAudit(): Audit | undefined {
    if (!this.selectedAuditId) return undefined;
    return this.auditEntities.find(audit => audit.id === this.selectedAuditId);
  }

  // Load saved data (for edit mode)
  loadSavedData() {
    const savedData = localStorage.getItem('asvAuditData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        
        // Update form data
        this.asvData = {
          numberOfIPs: data.numberOfIPs,
          IPDetails: data.IPDetails || '',
          associatedOrganization: data.associatedOrganization || '',
          associatedApplication: data.associatedApplication || '',
          legalEntityName: data.legalEntityName || '',
          audit: data.audit || '',
        };
        
        // Update search fields
        this.legalEntitySearch = data.legalEntityName || '';
        this.auditSearch = data.audit || '';
        
        // Update selected IDs
        this.selectedLegalEntityId = data.legalEntityId || null;
        this.selectedAuditId = data.auditId || null;
        
        // Update filtered lists
        this.onLegalEntitySearch();
        this.onAuditSearch();
        
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }
}