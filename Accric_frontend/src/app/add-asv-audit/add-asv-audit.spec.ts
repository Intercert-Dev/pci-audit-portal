import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAsvAudit } from './add-asv-audit';

describe('AddAsvAudit', () => {
  let component: AddAsvAudit;
  let fixture: ComponentFixture<AddAsvAudit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAsvAudit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAsvAudit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
