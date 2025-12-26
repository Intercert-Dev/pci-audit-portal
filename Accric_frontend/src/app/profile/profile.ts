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
  // Inject ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private toast=inject(ToastService);
  
  userProfile: any = {
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    avatarUrl: 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg',
  };
  
  showPopup = false;
  tempData: any = {};
  isLoading = true;
  errorMessage = '';
  userId: string = '';
  isSaving = false;
  saveSuccess = false;
  saveError = '';
  
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

        console.log('Extracted User ID:', this.userId);
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
      avatarUrl: decoded.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg',
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
    
    this.cdr.detectChanges();
    
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
   
    
    // Map API response fields to your profile structure
    // Based on the image, your API returns fields like:
    // name, phone, location, profile_image, etc.
    
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
    let avatarUrl = this.userProfile.avatarUrl; // Default
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
    
    this.userProfile = {
      name: name,
      email: userData.email || this.userProfile.email,
      phone: userData.phone || userData.phoneNumber || userData.mobile || this.userProfile.phone,
      location: userData.location || userData.address || userData.country || this.userProfile.location,
      title: userData.title || userData.role || userData.designation || this.userProfile.title,
      avatarUrl: avatarUrl,
      // Store the original profile_image for API updates
      profile_image: userData.profile_image || userData.avatar || ''
    };
  }

  openEditPopup(): void {
    this.tempData = { ...this.userProfile };
    this.showPopup = true;
    this.saveSuccess = false;
    this.saveError = '';
    this.cdr.detectChanges();
  }

  closeEditPopup(): void {
    this.showPopup = false;
    this.saveSuccess = false;
    this.saveError = '';
    this.cdr.detectChanges();
  }

  saveProfile(): void {
    if (!this.editProfileForm.valid) {
      return;
    }
    
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = '';
    
    // First update local profile
    this.userProfile = { ...this.tempData };
    
    // Then call API to update on server
    this.updateProfileOnServer();
  }

  updateProfileOnServer(): void {
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
      'Authorization': `Bearer ${token}`,
    });
    
    // Prepare the update data according to your API structure
    // Based on the image, your API expects these fields:
    const updateData: any = {
      name: this.tempData.name || '',
      phone: this.tempData.phone || '',
      location: this.tempData.location || '',
      // profile_image will be handled separately if it's a file
    };
    
    // If title exists in your API, include it
    if (this.tempData.title) {
      updateData.title = this.tempData.title;
    }
    
    // If email exists in your API, include it
    if (this.tempData.email) {
      updateData.email = this.tempData.email;
    }
    
    console.log('Sending update data:', updateData);
    
    this.http.put(`${this.updateUserUrl}${this.userId}`, updateData, { headers })
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
          this.saveSuccess = true;
          
          // If the API returns updated user data, update the profile
          if (response && response.data) {
            this.mapApiResponseToProfile(response.data);
          } else if (response && response.user) {
            this.mapApiResponseToProfile(response.user);
          }
          
          // Close popup after 2 seconds on success
          setTimeout(() => {
            this.showPopup = false;
            this.cdr.detectChanges();
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          
          if (error.status === 401) {
            this.saveError = 'Session expired. Please login again.';
          } else if (error.status === 400) {
            this.saveError = error.error?.message || 'Invalid data provided.';
          } else if (error.status === 404) {
            this.saveError = 'User not found.';
          } else if (error.status === 500) {
            this.saveError = 'Server error. Please try again later.';
          } else {
            this.saveError = error.error?.message || 'Failed to update profile. Please try again.';
          }
          
          // Revert to original data on error
          this.tempData = { ...this.userProfile };
        }
      });
  }

  // Handle image upload separately if your API supports file upload
  uploadProfileImage(): void {
    if (!this.tempData.avatarUrl || !this.tempData.avatarUrl.startsWith('data:image')) {
      return; // Not a new image
    }
    
    const token = localStorage.getItem('jwt');
    if (!token || !this.userId) return;
    
    // Convert data URL to blob
    const byteString = atob(this.tempData.avatarUrl.split(',')[1]);
    const mimeString = this.tempData.avatarUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const formData = new FormData();
    formData.append('profile_image', blob, 'profile.jpg');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData, let browser set it
    });
    
    // If your API has a separate endpoint for image upload
    const imageUploadUrl = `${this.baseUrl}/upload-profile-image/${this.userId}`;
    
    this.http.post(imageUploadUrl, formData, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Image uploaded successfully:', response);
          if (response && response.profile_image) {
            this.userProfile.avatarUrl = `${this.baseUrl}/uploads/${response.profile_image}`;
            this.userProfile.profile_image = response.profile_image;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error uploading image:', error);
        }
      });
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      this.toast.error("upload a correct image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.tempData.avatarUrl = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  refreshProfile(): void {
    this.fetchUserProfile();
  }

  // Getter for form validation
  get editProfileForm(): any {
    // This is a placeholder - in real scenario, use @ViewChild
    return { valid: true };
  }
}