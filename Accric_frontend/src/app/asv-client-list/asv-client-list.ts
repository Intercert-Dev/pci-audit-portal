import { Component, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import  saveAs  from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-asv-client-list',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './asv-client-list.html',
  styleUrl: './asv-client-list.css',
})
export class AsvClientList {

  serarch_text: string = "";
  filtered_list: any[] = []
  editingRow: any = null;

 clientList = [
  {
    company: "GLOBAL TECH INDUSTRIES",
    Q1: "Completed",
    Q2: "Pending",
    Q3: "Inprogress",
    Q4: "Pending"
  },
  {
    company: "BLUE OCEAN MANUFACTURING LTD",
    Q1: "Pending",
    Q2: "Completed",
    Q3: "Pending",
    Q4: "Inprogress"
  },
  {
    company: "EVEREST ENGINEERING SOLUTIONS",
    Q1: "Inprogress",
    Q2: "Pending",
    Q3: "Completed",
    Q4: "Pending"
  },
  {
    company: "SUNRISE FOOD PRODUCTS",
    Q1: "Completed",
    Q2: "Completed",
    Q3: "Pending",
    Q4: "Inprogress"
  },
  {
    company: "NATIONAL AUTOMATION CORP",
    Q1: "Pending",
    Q2: "Inprogress",
    Q3: "Completed",
    Q4: "Pending"
  },
  {
    company: "OASIS CHEMICAL INDUSTRIES",
    Q1: "Completed",
    Q2: "Pending",
    Q3: "Pending",
    Q4: "Completed"
  },
  {
    company: "METRO CONSTRUCTION GROUP",
    Q1: "Inprogress",
    Q2: "Completed",
    Q3: "Pending",
    Q4: "Pending"
  },
  {
    company: "ROYAL TEXTILES INTERNATIONAL",
    Q1: "Completed",
    Q2: "Completed",
    Q3: "Inprogress",
    Q4: "Pending"
  }
];

@ViewChild('Q1Input') Q1Input!: any;
@ViewChild('Q2Input') Q2Input!: any;
@ViewChild('Q3Input') Q3Input!: any;
@ViewChild('Q4Input') Q4Input!: any;

triggerInput(q: string) {
  if (q === 'Q1') this.Q1Input.nativeElement.click();
  if (q === 'Q2') this.Q2Input.nativeElement.click();
  if (q === 'Q3') this.Q3Input.nativeElement.click();
  if (q === 'Q4') this.Q4Input.nativeElement.click();
}

onFileSelect(event: any, q: string) {
  const file = event.target.files[0];
  if (!file) return;

  this.editingRow[q + 'File'] = file; // Q1File, Q2File, etc.
}

onPreview(q: string) {
  const file = this.editingRow[q + 'File'];
  if (!file) return;

  const fileURL = URL.createObjectURL(file);
  window.open(fileURL, '_blank');
}

onDownload(q: string) {
  const file = this.editingRow[q + 'File'];
  if (!file) return;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
}



  constructor() {
    this.filtered_list = [...this.clientList];
  }

  filter_list() {
    const search = this.serarch_text.toLowerCase();
    this.filtered_list = this.clientList.filter(
      item => item.company.toLowerCase().includes(search)
    );

  }

  exportToExcel() {
    const fileName = 'Client-Certificates.xlsx';

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filtered_list);

    const wb: XLSX.WorkBook = {
      Sheets: { 'Certificates': ws },
      SheetNames: ['Certificates']
    };

    // Convert workbook to binary data
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Save file
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  editRow(row: any) {
    // Create a clone for editing (so UI does not auto update)
    this.editingRow = { ...row };
  }
  saveEdit() {
    const index = this.clientList.findIndex(
      item => item.company === this.editingRow.company
    );

    if (index !== -1) {
      this.clientList[index] = { ...this.editingRow };
    }

    this.filter_list();      // refresh filtered list
    this.editingRow = null;  // close popup
  }

  cancelEdit() {
    this.editingRow = null;
  }

  deleteRow(row: any) {
    if (!confirm("Are you sure you want to delete this row?")) return;

    // Remove from main list
    this.clientList = this.clientList.filter(item => item !== row);

    // Refresh filtered list
    this.filter_list();
  }

}
