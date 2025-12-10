import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspendedClientList } from './suspended-client-list';

describe('SuspendedClientList', () => {
  let component: SuspendedClientList;
  let fixture: ComponentFixture<SuspendedClientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuspendedClientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuspendedClientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
