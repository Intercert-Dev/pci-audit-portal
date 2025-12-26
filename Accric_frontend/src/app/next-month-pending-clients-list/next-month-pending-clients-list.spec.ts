import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NextMonthPendingClientsList } from './next-month-pending-clients-list';

describe('NextMonthPendingClientsList', () => {
  let component: NextMonthPendingClientsList;
  let fixture: ComponentFixture<NextMonthPendingClientsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NextMonthPendingClientsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NextMonthPendingClientsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
