import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ClientData {
  company: string;
  Q1File?: File;
  Q1Status: string;
  Q2File?: File;
  Q2Status: string;
  Q3File?: File;
  Q3Status: string;
  Q4File?: File;
  Q4Status: string;
}

@Component({
  selector: 'app-edit-asv-client',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-asv-client.html',
  styleUrl: './edit-asv-client.css',
})
export class EditAsvClient {
  @ViewChild('Q1Input') Q1Input!: ElementRef<HTMLInputElement>;
  @ViewChild('Q2Input') Q2Input!: ElementRef<HTMLInputElement>;
  @ViewChild('Q3Input') Q3Input!: ElementRef<HTMLInputElement>;
  @ViewChild('Q4Input') Q4Input!: ElementRef<HTMLInputElement>;

  editingRow: ClientData = {
    company: 'Sample Company',
    Q1Status: 'PENDING',
    Q2Status: 'PENDING',
    Q3Status: 'PENDING',
    Q4Status: 'PENDING'
  };

  // Temporary storage for file data
  private fileDataMap: Map<string, { file: File, dataUrl: string }> = new Map();

  constructor(private router: Router  ) {
  }

  // Method to trigger file input click
  triggerInput(quarter: string) {
    switch (quarter) {
      case 'Q1':
        this.Q1Input.nativeElement.click();
        break;
      case 'Q2':
        this.Q2Input.nativeElement.click();
        break;
      case 'Q3':
        this.Q3Input.nativeElement.click();
        break;
      case 'Q4':
        this.Q4Input.nativeElement.click();
        break;
    }
  }

  // Handle file selection
  onFileSelect(event: Event, quarter: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Store file reference in editingRow
      switch (quarter) {
        case 'Q1':
          this.editingRow.Q1File = file;
          break;
        case 'Q2':
          this.editingRow.Q2File = file;
          break;
        case 'Q3':
          this.editingRow.Q3File = file;
          break;
        case 'Q4':
          this.editingRow.Q4File = file;
          break;
      }

      // Read file and store data URL for preview
      this.readAndStoreFile(file, quarter);
      
      // Reset the input to allow selecting the same file again
      input.value = '';
    }
  }

  // Read file and store as data URL
  private readAndStoreFile(file: File, quarter: string) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.fileDataMap.set(quarter, { file, dataUrl });
      
      // Auto-update status to INPROGRESS when a file is uploaded
      this.onStatusChange(quarter, 'INPROGRESS');
    };
    
    reader.readAsDataURL(file);
  }

  // Handle status change
  onStatusChange(quarter: string, status: string) {
    // Update the corresponding status
    switch (quarter) {
      case 'Q1':
        this.editingRow.Q1Status = status;
        break;
      case 'Q2':
        this.editingRow.Q2Status = status;
        break;
      case 'Q3':
        this.editingRow.Q3Status = status;
        break;
      case 'Q4':
        this.editingRow.Q4Status = status;
        break;
    }

    console.log(`${quarter} status changed to: ${status}`);
    
    // You can add additional logic here, like auto-saving or API calls
  }

  // Preview file
  onPreview(quarter: string) {
    const fileInfo = this.fileDataMap.get(quarter);
    const file = this.getFileByQuarter(quarter);
    
    if (!file && !fileInfo) {
      alert('No file available for preview');
      return;
    }

    if (fileInfo) {
      this.openFilePreview(fileInfo.dataUrl, fileInfo.file.name, fileInfo.file.type);
    } else if (file) {
      // If file exists but not in map, read it
      this.readAndPreviewFile(file, quarter);
    }
  }

  private readAndPreviewFile(file: File, quarter: string) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.fileDataMap.set(quarter, { file, dataUrl });
      this.openFilePreview(dataUrl, file.name, file.type);
    };
    
    reader.readAsDataURL(file);
  }

  private openFilePreview(dataUrl: string, fileName: string, fileType: string) {
    // For PDF files
    if (fileType === 'application/pdf') {
      const pdfWindow = window.open('');
      if (pdfWindow) {
        pdfWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Preview: ${fileName}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; }
              iframe { width: 100%; height: calc(100vh - 40px); border: none; }
            </style>
          </head>
          <body>
            <iframe src="${dataUrl}"></iframe>
          </body>
          </html>
        `);
      }
    } 
    // For image files
    else if (fileType.startsWith('image/')) {
      const imageWindow = window.open('');
      if (imageWindow) {
        imageWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Preview: ${fileName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
              }
              img { 
                max-width: 90%; 
                max-height: 90vh; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="${fileName}" />
          </body>
          </html>
        `);
      }
    }
    // For text files
    else if (fileType.startsWith('text/')) {
      const textContent = atob(dataUrl.split(',')[1]);
      const textWindow = window.open('');
      if (textWindow) {
        textWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Preview: ${fileName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5; 
                font-family: monospace; 
                white-space: pre-wrap; 
                word-wrap: break-word; 
              }
              pre { 
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                max-width: 800px; 
                margin: 0 auto; 
              }
            </style>
          </head>
          <body>
            <pre>${textContent}</pre>
          </body>
          </html>
        `);
      }
    }
    // For other file types - download instead
    else {
      alert('Preview not available for this file type. Please download the file.');
      this.downloadFile(dataUrl, fileName);
    }
  }

  // Download file
  onDownload(quarter: string) {
    const fileInfo = this.fileDataMap.get(quarter);
    const file = this.getFileByQuarter(quarter);
    
    if (!file && !fileInfo) {
      alert('No file available for download');
      return;
    }

    if (fileInfo) {
      this.downloadFile(fileInfo.dataUrl, fileInfo.file.name);
    } else if (file) {
      // If file exists but not in map, read and download it
      this.readAndDownloadFile(file, quarter);
    }
  }

  private readAndDownloadFile(file: File, quarter: string) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.fileDataMap.set(quarter, { file, dataUrl });
      this.downloadFile(dataUrl, file.name);
    };
    
    reader.readAsDataURL(file);
  }

  private downloadFile(dataUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Helper method to get file by quarter
  private getFileByQuarter(quarter: string): File | undefined {
    switch (quarter) {
      case 'Q1': return this.editingRow.Q1File;
      case 'Q2': return this.editingRow.Q2File;
      case 'Q3': return this.editingRow.Q3File;
      case 'Q4': return this.editingRow.Q4File;
      default: return undefined;
    }
  }

  // Save edits
  saveEdit() {
  
    try {
      const clientData = {
        company: this.editingRow.company,
        Q1Status: this.editingRow.Q1Status,
        Q2Status: this.editingRow.Q2Status,
        Q3Status: this.editingRow.Q3Status,
        Q4Status: this.editingRow.Q4Status,
      };
      this.cancelEdit();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Cancel edit
  cancelEdit() {
    console.log('Edit cancelled');
    this.router.navigate(['/asv-client-list']);

  }

  // Optional: Method to clear a specific quarter's file
  clearFile(quarter: string) {
    switch (quarter) {
      case 'Q1':
        this.editingRow.Q1File = undefined;
        break;
      case 'Q2':
        this.editingRow.Q2File = undefined;
        break;
      case 'Q3':
        this.editingRow.Q3File = undefined;
        break;
      case 'Q4':
        this.editingRow.Q4File = undefined;
        break;
    }
    
    this.fileDataMap.delete(quarter);
    console.log(`Cleared ${quarter} file`);
  }

  // Optional: Method to check if any files are uploaded
  hasUploadedFiles(): boolean {
    return !!(
      this.editingRow.Q1File ||
      this.editingRow.Q2File ||
      this.editingRow.Q3File ||
      this.editingRow.Q4File
    );
  }

  // Optional: Get status color for UI (can be used in template)
  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'INPROGRESS': return 'orange';
      case 'PENDING': return 'gray';
      default: return 'gray';
    }
  }
}