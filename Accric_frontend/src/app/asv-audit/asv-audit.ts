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
  
  // API URLs
  private apiUrl = 'https://pci.accric.com/api/auth/asv-fetch-details';
  // Updated quarter API endpoints based on your structure
  private completedQ1Url = 'https://pci.accric.com/api/auth/completed-q1';
  private completedQ2Url = 'https://pci.accric.com/api/auth/completed-q2';
  private completedQ3Url = 'https://pci.accric.com/api/auth/completed-q3';
  private completedQ4Url = 'https://pci.accric.com/api/auth/completed-q4';
  private pendingQ1Url = 'https://pci.accric.com/api/auth/pending-q1';
  private pendingQ2Url = 'https://pci.accric.com/api/auth/pending-q2';
  private pendingQ3Url = 'https://pci.accric.com/api/auth/pending-q3';
  private pendingQ4Url = 'https://pci.accric.com/api/auth/pending-q4';
  
  // For unsubscribing to prevent memory leaks
  private destroy$ = new Subject<void>();

  // Popup related properties
  showQuarterPopup = false;
  popupTitle = '';
  quarterType: 'completed' | 'pending' = 'completed';
  quarterNumber = 1;
  quarterData: any[] = [];
  isQuarterDataLoading = false;
  quarterErrorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.cdr.detectChanges();
    this.fetchASVData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchASVData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Mark for change detection
    this.cdr.detectChanges(); // Force immediate UI update for loading state
    
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.errorMessage = 'Please login first. No authentication token found.';
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    
    // Use markForCheck for better performance
    this.http.get<any>(this.apiUrl, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
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
            this.cdr.markForCheck();
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
          }
          
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  // Method to fetch quarter details based on quarter number and type
  fetchQuarterDetails(quarter: number, type: 'completed' | 'pending'): void {
    this.isQuarterDataLoading = true;
    this.quarterErrorMessage = '';
    this.quarterData = [];
    
    // Force immediate UI updates before API call
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.quarterErrorMessage = 'Authentication token not found';
      this.isQuarterDataLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    
    // Determine the API endpoint based on quarter and type
    let apiEndpoint = '';
    switch (quarter) {
      case 1:
        apiEndpoint = type === 'completed' ? this.completedQ1Url : this.pendingQ1Url;
        break;
      case 2:
        apiEndpoint = type === 'completed' ? this.completedQ2Url : this.pendingQ2Url;
        break;
      case 3:
        apiEndpoint = type === 'completed' ? this.completedQ3Url : this.pendingQ3Url;
        break;
      case 4:
        apiEndpoint = type === 'completed' ? this.completedQ4Url : this.pendingQ4Url;
        break;
      default:
        apiEndpoint = this.completedQ1Url;
    }
    
    this.http.get<any>(apiEndpoint, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isQuarterDataLoading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.message && response.message.includes('successfully') && response.data) {
            // Transform API data to match our table structure
            this.quarterData = this.transformQuarterData(response.data, quarter, type);
          } else {
            this.quarterErrorMessage = response.message || 'No data available';
          }
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching quarter details:', error);
          this.quarterErrorMessage = 'Failed to load quarter details.';
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  // Transform API data to match table structure
  private transformQuarterData(apiData: any[], quarter: number, type: 'completed' | 'pending'): any[] {
    const transformedData = apiData.map((item, index) => ({
      id: index + 1,
      companyName: item.associated_organization || 'N/A',
      assessmentType: item.associated_application || 'Assessment',
      // Get quarter status from the item (e.g., q1, q2, etc.)
      status: item[`q${quarter}`] || (type === 'completed' ? 'COMPLETED' : 'PENDING'),
      dueDate: item.updated_at || item.created_at || 'N/A',
      asvName: 'ASV', // You might want to add ASV name to your API response
      // Additional fields from API if needed
      numberOfIP: item.number_of_ip,
      ipDetails: item.ip_details,
      overallStatus: item.status,
      pdfUrl: item[`q${quarter}_pdf`]
    }));
    
    return transformedData;
  }

  // Method to open quarter popup
  openQuarterPopup(quarter: number, type: 'completed' | 'pending'): void {
    this.quarterNumber = quarter;
    this.quarterType = type;
    
    // Set popup title based on quarter and type
    const quarterText = `Q${quarter}`;
    const typeText = type === 'completed' ? 'Completed' : 'Pending';
    this.popupTitle = `${quarterText} ${typeText} Assessments`;
    
    // Show popup immediately before loading data
    this.showQuarterPopup = true;
    
    // Prevent body scrolling when popup is open
    document.body.style.overflow = 'hidden';
    
    // Force immediate UI update for popup opening
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Fetch data for the selected quarter after UI is updated
    setTimeout(() => {
      this.fetchQuarterDetails(quarter, type);
    }, 10); // Small delay to ensure UI renders first
  }

  // Method to close quarter popup
  closeQuarterPopup(): void {
    this.showQuarterPopup = false;
    this.quarterData = [];
    this.quarterErrorMessage = '';
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
    
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Add trackBy function for better *ngFor performance
  trackById(index: number, item: any): number {
    return item.id || index;
  }

  goToTotalClients(): void {
    this.router.navigate(['/asv-client-list']);
  }

  onCurrentPendingList(): void {
    this.router.navigate(['/current-pending-clients']);
  }

  onNextPendingList(): void {
    this.router.navigate(['/next-month-pending-clients']);
  }

  updateDashboardData(data: any): void {
    // Total counts - directly from backend
    this.totalClients = data.totalCount || 0;
    this.assessmentPending = data.pendingCount || 0;
    
    // Calculate completed assessments from backend data
    this.assessmentCompleted = 
      (data.q1CompletedCount || 0) + 
      (data.q2CompletedCount || 0) + 
      (data.q3CompletedCount || 0) + 
      (data.q4CompletedCount || 0);
    
    // Quarterly completed counts - directly from backend
    this.q1Completed = data.q1CompletedCount || 0;
    this.q2Completed = data.q2CompletedCount || 0;
    this.q3Completed = data.q3CompletedCount || 0;
    this.q4Completed = data.q4CompletedCount || 0;
    
    // Quarterly pending counts - directly from backend
    this.q1Pending = data.q1PendingCount || 0;
    this.q2Pending = data.q2PendingCount || 0;
    this.q3Pending = data.q3PendingCount || 0;
    this.q4Pending = data.q4PendingCount || 0;
    
    // IMPORTANT: Direct assignment from backend as per your requirement
    // currentPending should come from xCount value from backend
    this.currentPending = data.xCount || 0;
    
    // nextMonthPending should come from pendingCount value from backend
    this.nextMonthPending = data.pendingCount || 0;
    
    // Trigger change detection
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Refresh data method
  refreshData(): void {
    this.fetchASVData();
  }

  // Method to view PDF (if available)
  viewPDF(pdfUrl: string): void {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }

  // Method to get status badge class
  getStatusClass(status: string): string {
    if (!status) return 'pending';
    
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'COMPLETED':
        return 'completed';
      case 'INPROGRESS':
        return 'in-progress';
      case 'NOTSTARTED':
        return 'not-started';
      case 'PENDING':
        return 'pending';
      default:
        return 'pending';
    }
  }
}