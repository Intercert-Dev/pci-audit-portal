import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PciReportsList } from './pci-reports-list';

describe('PciReportsList', () => {
  let component: PciReportsList;
  let fixture: ComponentFixture<PciReportsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PciReportsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PciReportsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
