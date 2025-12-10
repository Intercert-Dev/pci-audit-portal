import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalClientList } from './total-client-list';

describe('TotalClientList', () => {
  let component: TotalClientList;
  let fixture: ComponentFixture<TotalClientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalClientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalClientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
