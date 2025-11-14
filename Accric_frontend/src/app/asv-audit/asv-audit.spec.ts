import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsvAudit } from './asv-audit';

describe('AsvAudit', () => {
  let component: AsvAudit;
  let fixture: ComponentFixture<AsvAudit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsvAudit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsvAudit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
