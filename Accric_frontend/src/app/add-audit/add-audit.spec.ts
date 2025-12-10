import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAudit } from './add-audit';

describe('AddAudit', () => {
  let component: AddAudit;
  let fixture: ComponentFixture<AddAudit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAudit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAudit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
