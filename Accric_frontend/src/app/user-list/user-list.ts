import { Component, OnInit } from '@angular/core';
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
  isLoading: boolean = false;  // add this

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getAllUsers();
  }

  getAllUsers() {
    this.isLoading = true;  // start loading
    const token = localStorage.getItem("jwt");
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<{ message: string; data: any[] }>("http://pci.accric.com/api/auth/user-list", { headers })
      .subscribe({
        next: (res) => {
          this.users = res.data;
          this.isLoading = false; // stop loading
        },
        error: (err) => {
          console.error("Error fetching users", err);
          this.isLoading = false; // stop loading even if error
        }
      });
  }
}

