import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-asv-audit',
  imports: [CommonModule],
  templateUrl: './asv-audit.html',
  styleUrl: './asv-audit.css',
})
export class AsvAudit {


  totalClients = 23000;
  assessmentCompleted = 864;
  assessmentPending = 127;

  currentPending = 864;
  nextMonthPending = 78;

  constructor(){}

}
