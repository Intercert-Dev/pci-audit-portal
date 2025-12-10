import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QsaAdd } from './qsa-add';

describe('QsaAdd', () => {
  let component: QsaAdd;
  let fixture: ComponentFixture<QsaAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QsaAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QsaAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
