import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalActiveClientList } from './total-active-client-list';

describe('TotalActiveClientList', () => {
  let component: TotalActiveClientList;
  let fixture: ComponentFixture<TotalActiveClientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalActiveClientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalActiveClientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
