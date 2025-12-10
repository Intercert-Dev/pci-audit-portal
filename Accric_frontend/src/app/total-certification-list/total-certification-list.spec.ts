import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalCertificationList } from './total-certification-list';

describe('TotalCertificationList', () => {
  let component: TotalCertificationList;
  let fixture: ComponentFixture<TotalCertificationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalCertificationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalCertificationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
