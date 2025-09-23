import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptTicket } from './receipt-ticket';

describe('ReceiptTicket', () => {
  let component: ReceiptTicket;
  let fixture: ComponentFixture<ReceiptTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptTicket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptTicket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
