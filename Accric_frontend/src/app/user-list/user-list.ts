import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../service/toast-service';

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

  showEditPopup: boolean = false;
  editModel: any = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private zone: NgZone  // <-- Added for reliable UI updates
  ) { }

  ngOnInit(): void {
    this.getAllUsers();
  }

  getAllUsers() {
    this.isLoading = true;

    const token = localStorage.getItem("jwt");
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get<any>("https://pci.accric.com/api/auth/user-list", { headers })
      .subscribe({
        next: (res) => {
          this.users = Array.isArray(res.data) ? res.data : [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching users", err);
          this.isLoading = false;
          this.toast.error("Failed to load users");
        }
      });
  }

  // --------------------------
  // EDIT USER
  // --------------------------
  editRow(user: any) {
   
    this.editModel = {
      user_id: user.user_id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || ''
    };
    this.showEditPopup = true;
  }

  cancelEdit() {
    this.showEditPopup = false;
    this.editModel = {};
  }

  saveEdit() {


    if (!this.editModel.user_id) {
      this.toast.error("User ID is missing. Cannot update user.");
      return;
    }

    if (!this.editModel.name || !this.editModel.email || !this.editModel.role) {
      this.toast.error("Please fill all required fields");
      return;
    }

    const token = localStorage.getItem("jwt");

    const payload = {
      name: this.editModel.name,
      email: this.editModel.email,
      role: this.editModel.role
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    const url = `https://pci.accric.com/api/auth/admin/update-user/${this.editModel.user_id}`;

    this.http.put(url, payload, { headers }).subscribe({
      next: (res: any) => {
        // Run all UI updates inside Angular's zone to ensure change detection
        this.zone.run(() => {
          this.toast.success("User updated successfully!");

          // Update the user in the list instantly
          const index = this.users.findIndex(u => u.user_id === this.editModel.user_id);
          if (index !== -1) {
            this.users[index] = {
              ...this.users[index],
              name: this.editModel.name,
              email: this.editModel.email,
              role: this.editModel.role
            };
          }

          // Close popup and reset model — this will now work 100%
          this.showEditPopup = false;
          this.editModel = {};

          // Optional: force detection if needed (usually not required with NgZone)
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error("Error updating user:", err);

        let errorMessage = "Error updating user";
        if (err.status === 401) {
          errorMessage = "Unauthorized. Please login again.";
        } else if (err.status === 403) {
          errorMessage = "You don't have permission to update users.";
        } else if (err.status === 404) {
          errorMessage = "User not found.";
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.toast.error(errorMessage);
      }
    });
  }
}