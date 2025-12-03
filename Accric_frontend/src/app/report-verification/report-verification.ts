import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-verification',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-verification.html',
  styleUrl: './report-verification.css',
})
export class ReportVerification {
  previousReportFile: File | null = null;
  currentReportFile: File | null = null;
  
  reportData = {
    verificationNotes: '',
    verificationStatus: '',
    verifiedBy: '',
    verificationDate: ''
  };

  onUpload(type: 'previous' | 'current') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        if (type === 'previous') {
          this.previousReportFile = file;
        } else {
          this.currentReportFile = file;
        }
      }
    };
    input.click();
  }

  onPreview(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    }
  }

  onDownload(type: 'previous' | 'current') {
    const file = type === 'previous' ? this.previousReportFile : this.currentReportFile;
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Report verification submitted:', this.reportData);
    }
  }
}