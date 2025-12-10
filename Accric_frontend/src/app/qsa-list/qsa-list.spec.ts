import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QsaList } from './qsa-list';

describe('QsaList', () => {
  let component: QsaList;
  let fixture: ComponentFixture<QsaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QsaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QsaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
