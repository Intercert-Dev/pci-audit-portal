import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {


  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Step 1: get JWT token from URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];  // get token from ?token=xxx

      if (token) {
        console.log("JWT Token Received:", token);

        // Step 2: Save token in localStorage
        localStorage.setItem('jwt', token);

        // Step 3: Remove token from URL
        this.router.navigate([], {
          relativeTo: this.route,
          replaceUrl: true,
          queryParams: {}
        });
      }
    });
  }

  cards = [
    { id: 1, count: 507, title: 'User', link: 'Related Link' },
    { id: 2, count: 178, title: 'Certification Form', link: 'Related Link' },
    { id: 3, count: 235, title: 'Auditor', link: 'Related Link' },
    { id: 4, count: 856, title: 'Client', link: 'Related Link' }
  ];
}
