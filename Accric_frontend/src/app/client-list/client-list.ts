import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import  saveAs  from 'file-saver';

@Component({
  selector: 'app-client-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ReactiveFormsModule],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientList {

  serarch_text: string = "";
  filtered_list: any[]=[]
  editingRow: any = null;

  clientList = [
    {
      company: "GLOBAL TECH INDUSTRIES",
      certNo: "IC-QM-8745123",
      standard: "ISO 9001:2015",
      issueDate: "2024-05-10",
      validDate: "2027-05-09",
      status: "Y"
    },
    {
      company: "BLUE OCEAN MANUFACTURING LTD",
      certNo: "IC-QM-4257894",
      standard: "ISO 14001:2015",
      issueDate: "2023-09-22",
      validDate: "2026-09-21",
      status: "N"
    },
    {
      company: "EVEREST ENGINEERING SOLUTIONS",
      certNo: "IC-QM-9632547",
      standard: "ISO 45001:2018",
      issueDate: "2025-01-15",
      validDate: "2028-01-14",
      status: "Y"
    },
    {
      company: "SUNRISE FOOD PRODUCTS",
      certNo: "IC-QM-5821479",
      standard: "ISO 22000:2018",
      issueDate: "2024-03-05",
      validDate: "2027-03-04",
      status: "Y"
    },
    {
      company: "NATIONAL AUTOMATION CORP",
      certNo: "IC-QM-7412589",
      standard: "ISO 27001:2022",
      issueDate: "2024-11-01",
      validDate: "2027-10-31",
      status: "N"
    },
    {
      company: "OASIS CHEMICAL INDUSTRIES",
      certNo: "IC-QM-3698741",
      standard: "ISO 9001:2015",
      issueDate: "2023-12-12",
      validDate: "2026-12-11",
      status: "Y"
    },
    {
      company: "METRO CONSTRUCTION GROUP",
      certNo: "IC-QM-2589634",
      standard: "ISO 45001:2018",
      issueDate: "2024-02-18",
      validDate: "2027-02-17",
      status: "N"
    },
    {
      company: "ROYAL TEXTILES INTERNATIONAL",
      certNo: "IC-QM-1478529",
      standard: "ISO 14001:2015",
      issueDate: "2025-06-20",
      validDate: "2028-06-19",
      status: "Y"
    }
  ];

   constructor() {
    this.filtered_list = [...this.clientList];
  }

  filter_list() {
    const search = this.serarch_text.toLowerCase();
    this.filtered_list = this.clientList.filter(
      item => item.company.toLowerCase().includes(search) ||
        item.certNo.toLowerCase().includes(search) ||
        item.standard.toLowerCase().includes(search) ||
        item.issueDate.toLowerCase().includes(search) ||
        item.validDate.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
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
    item => item.certNo === this.editingRow.certNo
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
