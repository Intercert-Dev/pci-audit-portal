import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalUpcomingAuditList } from './total-upcoming-audit-list';

describe('TotalUpcomingAuditList', () => {
  let component: TotalUpcomingAuditList;
  let fixture: ComponentFixture<TotalUpcomingAuditList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalUpcomingAuditList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalUpcomingAuditList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
