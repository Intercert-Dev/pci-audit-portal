import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsvClientList } from './asv-client-list';

describe('AsvClientList', () => {
  let component: AsvClientList;
  let fixture: ComponentFixture<AsvClientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsvClientList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsvClientList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
