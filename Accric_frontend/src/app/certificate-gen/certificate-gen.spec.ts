import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateGen } from './certificate-gen';

describe('CertificateGen', () => {
  let component: CertificateGen;
  let fixture: ComponentFixture<CertificateGen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateGen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateGen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
