import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QsaService } from '../service/qsa-service';

export interface QSA {
  id: number;
  qsa_name: string;
  email: string;
  qsa_certificate_number: string; // added this field
  signature: string; // URL
}

@Component({
  selector: 'app-qsa-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qsa-list.html',
  styleUrl: './qsa-list.css',
})
export class QsaList implements OnInit {
  qsaList: QSA[] = [];
  isLoading = false;

  // EDIT POPUP STATE
  showEditPopup = false;
  editModel: QSA | any = {}; // used in ngModel bindings
  newSignatureFile: File | null = null;

  constructor(private qsaService: QsaService) {}

  ngOnInit(): void {
    this.loadQsaList();
  }

  // Load QSA list
  loadQsaList(): void {
    this.isLoading = true;
    this.qsaService.getQsaList().subscribe({
      next: (res) => {
        this.qsaList = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load QSA list', err);
        this.isLoading = false;
      }
    });
  }

  // Open edit popup
  editQsa(qsa: QSA): void {
    this.editModel = { ...qsa }; // clone selected record
    this.showEditPopup = true;
  }

  // Cancel edit
  cancelEdit(): void {
    this.showEditPopup = false;
    this.editModel = {};
    this.newSignatureFile = null;
  }

  // Handle signature upload
  onSignatureUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.newSignatureFile = file;
  }

  // Save edited QSA
  saveEdit(): void {
    if (!this.editModel.id) return;

    const formData = new FormData();
    formData.append('qsa_name', this.editModel.qsa_name);
    formData.append('email', this.editModel.email);
    formData.append('qsa_certificate_number', this.editModel.qsa_certificate_number);

    if (this.newSignatureFile) {
      formData.append('signature', this.newSignatureFile);
    }

    this.qsaService.updateQsa(this.editModel.id, formData).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadQsaList();
      },
      error: (err) => {
        console.error('Update failed', err);
      }
    });
  }

  // Delete QSA
  deleteQsa(qsa: QSA): void {
    if (!confirm('Are you sure you want to delete this QSA?')) return;

    this.qsaService.deleteQsa(qsa.id).subscribe({
      next: () => {
        this.loadQsaList();
      },
      error: (err) => {
        console.error('Delete failed', err);
      }
    });
  }
}
