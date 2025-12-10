import { Component, ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asv-client-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
      Q4: "Pending",
    },
    {
      company: "BLUE OCEAN MANUFACTURING LTD",
      Q1: "Pending",
      Q2: "Completed",
      Q3: "Pending",
      Q4: "Inprogress",
    },
    // Add similar status fields for all other items
  ];

  

  constructor(private router: Router) {
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
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  editRow(row: any) {
    // Create a clone for editing with default status if not exists
    this.router.navigate(['/edit-asv-list'], { state: { clientData: row } });
  }
  deleteRow(row: any) {
    // Create a clone for editing with default status if not exists
    this.router.navigate(['/edit-asv-list'], { state: { clientData: row } });
  }




 

}