import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsvAuditClientList } from './asv-audit-client-list';

describe('AsvAuditClientList', () => {
  let component: AsvAuditClientList;
  let fixture: ComponentFixture<AsvAuditClientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsvAuditClientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsvAuditClientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
