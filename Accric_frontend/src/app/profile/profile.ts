import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface UserProfile {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  social: {
    linkedin: string;
    github: string;
    website: string;
  };
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})




export class Profile implements OnInit {

  userProfile: UserProfile;

  constructor() {
    this.userProfile = {
      name: 'Jesmin',
      title: 'CEO',
      bio: 'Passionate developer focused on building intuitive, responsive, and performant user interfaces with Angular and modern web technologies. Constantly learning and exploring new design patterns.',
      avatarUrl: '/assets/57d3d250790e98129931897251abd3915a931233.jpg',
      email: 'jane.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS', 'HTML5', 'Flexbox/Grid', 'UX/UI'],
      social: {
        linkedin: 'https://linkedin.com/in/janedoe',
        github: 'https://github.com/janedoe',
        website: 'https://janedoe.dev'
      }
    };
  }

  ngOnInit(): void {
  }
}
