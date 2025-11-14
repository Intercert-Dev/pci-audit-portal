import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-list',
  imports: [CommonModule,FormsModule,ReactiveFormsModule,ReactiveFormsModule],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientList {

  clientList = [
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  },
  {
    company: "AL TAKAMOL FACTORY FOR INDUSTRY",
    certNo: "IC-QM-2511158",
    standard: "ISO 9001:2015",
    issueDate: "2025-11-13",
    validDate: "2028-11-12",
    status: "Y"
  }
];

}
