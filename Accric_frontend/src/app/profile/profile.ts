import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastService } from '../service/toast-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  
  userProfile: any = {
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    role: '',
    avatarUrl: 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg',
    profile_image: null
  };
  
  showPopup = false;
  tempData: any = {};
  isLoading = true;
  errorMessage = '';
  userId: string = '';
  isSaving = false;
  saveSuccess = false;
  saveError = '';
  imageUploading = false;
  selectedImageFile: File | null = null;
  
  // API URLs
  private baseUrl = 'http://pci.accric.com/api/auth';
  private userDetailsUrl = `${this.baseUrl}/user-details/`;
  private updateUserUrl = `${this.baseUrl}/update-user/`;
  
  // For unsubscribing to prevent memory leaks
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.extractUserIdFromToken();
    if (this.userId) {
      this.fetchUserProfile();
    } else {
      this.loadFromToken();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractUserIdFromToken(): void {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded: any = JSON.parse(atob(token.split('.')[1]));
        
        // Try different possible user ID fields
        this.userId = decoded.userId || decoded.id || decoded.sub || decoded.user_id || '';
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Invalid token format:', e);
      }
    }
  }

  private loadFromToken(): void {
    const token = localStorage.getItem('jwt');
    let decoded: any = {};
    
    if (token) {
      try {
        decoded = JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }

    const extractedName = decoded.email
      ? decoded.email
          .split('@')[0]
          .replace(/\./g, ' ')
          .replace(/[^a-zA-Z ]/g, '')
          .trim()
      : 'User';

    this.userProfile = {
      name: extractedName.toUpperCase(),
      email: decoded.email || 'user@example.com',
      phone: decoded.phone || '123-456-7890',
      location: decoded.location || 'India',
      title: decoded.role || decoded.title || 'Member',
      role: decoded.role || 'Member',
      avatarUrl: decoded.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg',
      profile_image: null
    };
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  fetchUserProfile(): void {
    if (!this.userId) {
      this.errorMessage = 'User ID not found';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.saveSuccess = false;
    this.saveError = '';
    this.cdr.detectChanges();
    
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      this.errorMessage = 'Please login first. No authentication token found.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    
    this.http.get<any>(`${this.userDetailsUrl}${this.userId}`, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          console.log("Response Data: ", response);
          
          if (response && response.data) {
            this.mapApiResponseToProfile(response.data);
          } else if (response && (response.name || response.email)) {
            // If response is directly the user object
            this.mapApiResponseToProfile(response);
          } else {
            this.errorMessage = 'Invalid response format';
            this.loadFromToken();
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching user profile:', error);
          
          if (error.status === 401) {
            this.errorMessage = 'Session expired. Please login again.';
          } else if (error.status === 404) {
            this.errorMessage = 'User not found.';
            this.loadFromToken();
          } else {
            this.errorMessage = 'Failed to load profile. Using token data.';
            this.loadFromToken();
          }
          this.cdr.detectChanges();
        }
      });
  }

  private mapApiResponseToProfile(userData: any): void {
    let name = '';
    if (userData.name) name = userData.name;
    else if (userData.fullName) name = userData.fullName;
    else if (userData.firstName && userData.lastName) name = `${userData.firstName} ${userData.lastName}`;
    else if (userData.email) {
      name = userData.email
        .split('@')[0]
        .replace(/\./g, ' ')
        .replace(/[^a-zA-Z ]/g, '')
        .trim()
        .toUpperCase();
    } else {
      name = 'User';
    }
    
    // Construct image URL if profile_image is provided
    let avatarUrl = 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg';
    if (userData.profile_image) {
      // Check if it's a full URL or just a filename
      if (userData.profile_image.startsWith('http')) {
        avatarUrl = userData.profile_image;
      } else {
        // If it's just a filename, construct the full URL
        avatarUrl = `${this.baseUrl}/uploads/${userData.profile_image}`;
      }
    } else if (userData.avatar) {
      avatarUrl = userData.avatar;
    }
    
    // Update user profile with exact API response structure
    this.userProfile = {
      name: name,
      email: userData.email || this.userProfile.email,
      phone: userData.phone || this.userProfile.phone,
      location: userData.location || this.userProfile.location,
      title: userData.role || userData.title || this.userProfile.title,
      role: userData.role || this.userProfile.role,
      avatarUrl: avatarUrl,
      profile_image: userData.profile_image || null
    };
    
    console.log('Updated user profile:', this.userProfile);
  }

  openEditPopup(): void {
    this.tempData = { ...this.userProfile };
    this.selectedImageFile = null;
    this.showPopup = true;
    this.saveSuccess = false;
    this.saveError = '';
    this.cdr.detectChanges();
  }

  closeEditPopup(): void {
    this.showPopup = false;
    this.saveSuccess = false;
    this.saveError = '';
    this.selectedImageFile = null;
    this.cdr.detectChanges();
  }

  saveProfile(): void {
    // Basic validation
    if (!this.tempData.name || !this.tempData.email) {
      this.saveError = 'Name and email are required';
      this.cdr.detectChanges();
      return;
    }
    
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = '';
    this.cdr.detectChanges();
    
    // Update profile using single API call
    this.updateProfile();
  }

  updateProfile(): void {
    if (!this.userId) {
      this.saveError = 'User ID not found';
      this.isSaving = false;
      this.cdr.detectChanges();
      return;
    }
    
    const token = localStorage.getItem('jwt');
    if (!token) {
      this.saveError = 'Authentication token not found';
      this.isSaving = false;
      this.cdr.detectChanges();
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: Don't set Content-Type for FormData, browser will set it automatically
    });
    
    // Create FormData to handle both file and text data
    const formData = new FormData();
    
    // Add text fields according to API structure
    formData.append('name', this.tempData.name || '');
    formData.append('email', this.tempData.email || '');
    formData.append('phone', this.tempData.phone || '');
    formData.append('location', this.tempData.location || '');
    
    // Add image file if selected
    if (this.selectedImageFile) {
      formData.append('profile_image', this.selectedImageFile);
    }
    
    console.log('Sending update data with FormData for user ID:', this.userId);
    
    this.http.put(`${this.updateUserUrl}${this.userId}`, formData, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Profile updated successfully:', response);
          
          if (response && response.data) {
            // Update local profile with API response data
            this.mapApiResponseToProfile(response.data);
            this.saveSuccess = true;
            this.toast.success('Profile updated successfully!');
            
            // Close popup after 1.5 seconds on success
            setTimeout(() => {
              this.closeEditPopup();
              this.cdr.detectChanges();
            }, 1500);
          } else if (response && response.message) {
            // If response only has message, refresh profile
            this.saveSuccess = true;
            this.toast.success(response.message);
            
            // Refresh profile data
            setTimeout(() => {
              this.fetchUserProfile();
              this.closeEditPopup();
              this.cdr.detectChanges();
            }, 1000);
          } else {
            this.saveError = 'Invalid response from server';
            this.toast.error('Invalid response from server');
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          
          let errorMessage = 'Failed to update profile. Please try again.';
          
          if (error.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid data provided.';
          } else if (error.status === 404) {
            errorMessage = 'User not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.saveError = errorMessage;
          this.toast.error(errorMessage);
          
          // Revert to original data on error
          this.tempData = { ...this.userProfile };
          this.cdr.detectChanges();
        }
      });
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      this.toast.error("Please upload a valid image file (JPG, PNG, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error("Image size should be less than 5MB");
      return;
    }

    this.selectedImageFile = file;
    this.imageUploading = true;
    this.cdr.detectChanges();
    
    // Preview image immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.tempData.avatarUrl = reader.result as string;
      this.imageUploading = false;
      this.cdr.detectChanges();
    };
    
    reader.onerror = () => {
      this.imageUploading = false;
      this.toast.error("Failed to read image file");
      this.cdr.detectChanges();
    };
    
    reader.readAsDataURL(file);
  }

  refreshProfile(): void {
    this.fetchUserProfile();
  }
}