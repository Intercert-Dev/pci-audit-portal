import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageQSA } from './manage-qsa';

describe('ManageQSA', () => {
  let component: ManageQSA;
  let fixture: ComponentFixture<ManageQSA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageQSA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageQSA);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
