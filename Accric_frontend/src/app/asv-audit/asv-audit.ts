import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asv-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './asv-audit.html',
  styleUrl: './asv-audit.css',
})
export class AsvAudit implements OnInit, OnDestroy {
  // Inject ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);
  
  // API Response Data
  apiData: any = null;
  
  // Dashboard Stats
  totalClients = 0;
  assessmentCompleted = 0;
  assessmentPending = 0;
  
  // Quarterly Completed counts
  q1Completed = 0;
  q2Completed = 0;
  q3Completed = 0;
  q4Completed = 0;
  
  // Quarterly Pending counts
  q1Pending = 0;
  q2Pending = 0;
  q3Pending = 0;
  q4Pending = 0;
  
  currentPending = 0;
  nextMonthPending = 0;
  
  // Loading and Error states
  isLoading = true;
  errorMessage = '';
  
  // API URL
  private apiUrl = 'http://pci.accric.com/api/auth/asv-fetch-details';
  
  // For unsubscribing to prevent memory leaks
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient,private router:Router) {}

  ngOnInit(): void {
    this.fetchASVData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchASVData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.errorMessage = 'Please login first. No authentication token found.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Create headers with authorization token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Manually trigger change detection for loading state
    this.cdr.detectChanges();
    
    this.http.get<any>(this.apiUrl, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.message === "ASV details fetched successfully" && response.data) {
            this.apiData = response.data;
            this.updateDashboardData(response.data);
          } else {
            this.errorMessage = response.message || 'Invalid response format';
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error fetching ASV data:', error);
          
          if (error.status === 401) {
            this.errorMessage = 'Session expired. Please login again.';
          } else if (error.status === 403) {
            this.errorMessage = 'Access denied. You do not have permission to view this data.';
          } else {
            this.errorMessage = 'Failed to load ASV dashboard data. Please try again later.';
            // Load sample data for testing if API fails
            this.loadSampleData();
          }
          
          this.cdr.detectChanges();
        }
      });
  }

  goToTotalClients():void{
    this.router.navigate([
      '/asv-client-list'
    ])
  }
  onCurrentPendingList():void{
    this.router.navigate([
      '/current-pending-clients'
    ])
  }
  onNextPendingList():void{
    this.router.navigate([
      '/next-month-pending-clients'
    ])
  }

  updateDashboardData(data: any): void {
    // Total counts
    this.totalClients = data.totalCount || 0;
    this.assessmentPending = data.pendingCount || 0;
    
    // Calculate completed assessments
    this.assessmentCompleted = 
      (data.q1CompletedCount || 0) + 
      (data.q2CompletedCount || 0) + 
      (data.q3CompletedCount || 0) + 
      (data.q4CompletedCount || 0);
    
    // Quarterly completed counts
    this.q1Completed = data.q1CompletedCount || 0;
    this.q2Completed = data.q2CompletedCount || 0;
    this.q3Completed = data.q3CompletedCount || 0;
    this.q4Completed = data.q4CompletedCount || 0;
    
    // Quarterly pending counts
    this.q1Pending = data.q1PendingCount || 0;
    this.q2Pending = data.q2PendingCount || 0;
    this.q3Pending = data.q3PendingCount || 0;
    this.q4Pending = data.q4PendingCount || 0;
    
    // For current pending - using xCount as per your API response
    this.currentPending = data.xCount || 0;
    
    // For next month pending - if not in API, calculate or set default
    this.nextMonthPending = Math.max(0, this.assessmentPending - this.currentPending);
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  // Method to load sample data for testing
  loadSampleData(): void {
    const sampleData = {
      totalCount: 4,
      pendingCount: 3,
      xCount: 3,
      q1CompletedCount: 1,
      q2CompletedCount: 0,
      q3CompletedCount: 0,
      q4CompletedCount: 0,
      q1PendingCount: 3,
      q2PendingCount: 0,
      q3PendingCount: 0,
      q4PendingCount: 0
    };
    
    this.updateDashboardData(sampleData);
  }

  // Refresh data method
  refreshData(): void {
    this.fetchASVData();
  }
}