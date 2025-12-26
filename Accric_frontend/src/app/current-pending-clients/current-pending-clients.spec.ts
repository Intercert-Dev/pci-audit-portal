import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentPendingClients } from './current-pending-clients';

describe('CurrentPendingClients', () => {
  let component: CurrentPendingClients;
  let fixture: ComponentFixture<CurrentPendingClients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentPendingClients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentPendingClients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
