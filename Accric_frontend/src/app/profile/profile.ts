import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {

  userProfile: any;
  showPopup = false;
  tempData: any = {};

  ngOnInit(): void {
    const token = localStorage.getItem('jwt');

    let decoded: any = {};
    if (token) {
      try {
        decoded = JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        console.error('Invalid token');
      }
    }

    const extractedName = decoded.email
      ? decoded.email
        .split("@")[0]         
        .replace(/\./g, ' ')    
        .replace(/[^a-zA-Z ]/g, '')
        .trim()                  
      : "User";


    this.userProfile = {
      // name: decoded.email ? decoded.email.split("@")[0] : "User",
      name: extractedName.toUpperCase(),
      email: decoded.email,
      phone: "123-456-7890",
      location: "India",
      title: decoded.role || "Member",
      avatarUrl: "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg",
      social: {
        linkedin: "#",
        github: "#",
        website: "#"
      }
    };
  }

  openEditPopup() {
    this.tempData = { ...this.userProfile };
    this.showPopup = true;
  }

  closeEditPopup() {
    this.showPopup = false;
  }

  saveProfile() {
    this.userProfile = { ...this.tempData };
    this.showPopup = false;
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.tempData.avatarUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }

}