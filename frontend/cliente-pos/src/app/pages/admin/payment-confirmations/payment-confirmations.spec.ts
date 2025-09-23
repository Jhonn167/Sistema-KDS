import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentConfirmations } from './payment-confirmations';

describe('PaymentConfirmations', () => {
  let component: PaymentConfirmations;
  let fixture: ComponentFixture<PaymentConfirmations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentConfirmations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentConfirmations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
