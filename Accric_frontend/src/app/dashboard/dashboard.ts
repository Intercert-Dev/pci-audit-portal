import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone : true,
  imports : [CommonModule ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  cards = [
    { id : 1,count: 507, title: 'User', link: 'Related Link' },
    { id : 2,count: 178, title: 'Certification Form', link: 'Related Link' },
    { id : 3,count: 235, title: 'Auditor', link: 'Related Link' },
    { id : 4,count: 856, title: 'Client', link: 'Related Link' }
  ];
}
