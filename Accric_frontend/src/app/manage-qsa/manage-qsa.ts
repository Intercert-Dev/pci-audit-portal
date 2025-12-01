import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QsaList } from '../qsa-list/qsa-list';
import { QsaAdd } from '../qsa-add/qsa-add';

@Component({
  selector: 'app-manage-qsa',
  standalone: true,
  imports: [CommonModule, QsaList, QsaAdd],
  templateUrl: './manage-qsa.html',
  styleUrls: ['./manage-qsa.css']
})
export class ManageQSA {
  // Only needed for tabs
  activeTab: 'add' | 'list' = 'add';
}
