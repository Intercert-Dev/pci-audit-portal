import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  loginData: any = null;
  
  // Actual values from API
  actualTotalClients: number = 0;
  actualActiveClients: number = 0;
  actualSuspendedClients: number = 0;
  actualTotalCertificates: number = 0;
  upcomingAudits: any[] = [];
  
  // Animated values (displayed values)
  totalClients: number = 0;
  activeClients: number = 0;
  suspendedClients: number = 0;
  totalCertificates: number = 0;
  
  // Animation settings
  animationDuration: number = 750; // 2 seconds
  frameRate: number = 60; // frames per second
  animationInProgress: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        localStorage.setItem('jwt', token);
        
        this.router.navigate([], {
          relativeTo: this.route,
          replaceUrl: true,
          queryParams: {}
        });

        this.fetchLoginDetails(token);
      } else {
        const savedToken = localStorage.getItem('jwt');
        if (savedToken) {
          this.fetchLoginDetails(savedToken);
        }
      }
    });
  }

  fetchLoginDetails(token: string) {
    const url = "http://pci.accric.com/api/auth/login-response";
    const headers = new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (res: any) => {

        this.loginData = res;
        
        // Store actual values from API
        this.actualTotalClients = res.totalClients || 0;
        this.actualActiveClients = res.activeClientsCount || 0;
        this.actualSuspendedClients = res.suspendedClientsCount || 0;
        this.actualTotalCertificates = res.clientsWithCertificateCount || 0;
        this.upcomingAudits = res.activeOldCertificates || [];
        
        // Reset animated values to 0
        this.totalClients = 0;
        this.activeClients = 0;
        this.suspendedClients = 0;
        this.totalCertificates = 0;
        
        // Start count-up animations
        this.startAllAnimations();
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Login Response API Failed:", err);
        this.cdr.detectChanges();
      }
    });
  }

  // Method to animate a single value
  animateValue(start: number, end: number, duration: number, callback: (value: number) => void) {
    if (start === end) {
      callback(end);
      return;
    }
    
    const range = end - start;
    const increment = range / (duration / (1000 / this.frameRate));
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      
      // Check if we've reached or passed the target
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      
      // Call the callback with the current value (rounded for display)
      callback(Math.round(current));
      
      // Force UI update
      this.cdr.detectChanges();
    }, 1000 / this.frameRate);
  }

  // Start animations for all counters
  startAllAnimations() {
    this.animationInProgress = true;
    
    // Animate each counter
    this.animateValue(0, this.actualTotalClients, this.animationDuration, 
      (value) => this.totalClients = value);
    
    this.animateValue(0, this.actualActiveClients, this.animationDuration, 
      (value) => this.activeClients = value);
    
    this.animateValue(0, this.actualSuspendedClients, this.animationDuration, 
      (value) => this.suspendedClients = value);
    
    this.animateValue(0, this.actualTotalCertificates, this.animationDuration, 
      (value) => this.totalCertificates = value);
    
    // Set a timeout to mark animation as complete
    setTimeout(() => {
      this.animationInProgress = false;
    }, this.animationDuration);
  }

  // Optional: Method to restart animations (can be triggered by a button)
  restartAnimations() {
    this.startAllAnimations();
  }
}