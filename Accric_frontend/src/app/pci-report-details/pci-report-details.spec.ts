import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PciReportDetails } from './pci-report-details';

describe('PciReportDetails', () => {
  let component: PciReportDetails;
  let fixture: ComponentFixture<PciReportDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PciReportDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PciReportDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
