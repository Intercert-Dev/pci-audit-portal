import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],
})
export class UserList implements OnInit {
  
  users: any[] = [];
  isLoading: boolean = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getAllUsers();
  }


  getAllUsers() {
    this.isLoading = true;

    const token = localStorage.getItem("jwt");
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any>("http://pci.accric.com/api/auth/user-list", { headers })
      .subscribe({
        next: (res) => {
          const raw = res["data"];

          if (Array.isArray(raw)) {
            this.users = raw;
          } else {
            this.users = [];
          }

          this.isLoading = false;
          
          // 3. Force the view to refresh
          this.cdr.detectChanges(); 
        },

        error: (err) => {
          console.error("Error fetching users", err);
          this.isLoading = false;
        }
      });
  }

  // getAllUsers() {
  //   this.isLoading = true;

  //   const token = localStorage.getItem("jwt");
  //   const headers = { 'Authorization': `Bearer ${token}` };

  //   this.http.get<any>("http://pci.accric.com/api/auth/user-list", { headers })
  //     .subscribe({
  //       next: (res) => {
  //         console.log("FULL RESPONSE:", res);
  //         console.log("RESPONSE KEYS:", Object.keys(res));

  //         // Always access the key safely
  //         const raw = res["data"];
  //         console.log("RAW DATA:", raw);

  //         if (Array.isArray(raw)) {
  //           this.users = raw;
  //         } else {
  //           this.users = [];
  //         }

  //         console.log("FINAL USERS ARRAY:", this.users);
  //         this.isLoading = false;
  //       },

  //       error: (err) => {
  //         console.error("Error fetching users", err);
  //         this.isLoading = false;
  //       }
  //     });
  // }
}
