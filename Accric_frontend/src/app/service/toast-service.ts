import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastr: ToastrService) {}

  success(message: string, title = 'Success') {
    this.toastr.success(message, title);
  }

  error(message: string, title = 'Error') {
    this.toastr.error(message, title);
  }

  warning(message: string, title = 'Warning') {
    this.toastr.warning(message, title);
  }

  info(message: string, title = 'Info') {
    this.toastr.info(message, title);
  }
}
