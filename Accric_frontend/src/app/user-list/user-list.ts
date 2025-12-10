import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],
})
export class UserList implements OnInit {

  users: any[] = [];
  isLoading: boolean = false;

  showEditPopup: boolean = false;  // Controls popup visibility
  editModel: any = {};      // temp object for edit form

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

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
          this.users = Array.isArray(res.data) ? res.data : [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching users", err);
          this.isLoading = false;
        }
      });
  }

  // --------------------------
  // EDIT USER
  // --------------------------
  editRow(user: any) {
    this.editModel = { ...user };  // copy values into popup form
    this.showEditPopup = true;
  }

  cancelEdit() {
    this.showEditPopup = false;
    this.editModel = {};
  }

  saveEdit() {
    const token = localStorage.getItem("jwt");
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.put(`http://pci.accric.com/api/auth/update-user/${this.editModel.id}`, this.editModel, { headers })
      .subscribe({
        next: (res) => {
          alert("User updated successfully!");

          // Update table instantly
          const index = this.users.findIndex(u => u.id === this.editModel.id);
          if (index !== -1) {
            this.users[index] = { ...this.editModel };
          }

          this.showEditPopup = false; // close popup
        },
        error: err => {
          console.error(err);
          alert("Error updating user");
        }
      });
  }

  // --------------------------
  // DELETE USER
  // --------------------------
  deleteRow(user: any) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("jwt");
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.delete(`http://pci.accric.com/api/auth/delete-user/${user.id}`, { headers })
      .subscribe({
        next: (res) => {
          alert("User deleted!");

          // remove from table instantly
          this.users = this.users.filter(u => u.id !== user.id);
        },
        error: err => {
          console.error(err);
          alert("Error deleting user");
        }
      });
  }

}