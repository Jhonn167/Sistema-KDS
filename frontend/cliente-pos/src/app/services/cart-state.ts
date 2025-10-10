// src/app/services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  private orderTypeSource = new BehaviorSubject<'inmediato' | 'futuro' | null>(null);
  private pickupDateSource = new BehaviorSubject<string>('');
  private contactPhoneSource = new BehaviorSubject<string>('');

  orderType$ = this.orderTypeSource.asObservable();
  pickupDate$ = this.pickupDateSource.asObservable();
  contactPhone$ = this.contactPhoneSource.asObservable();

  constructor() { }

  setOrderType(type: 'inmediato' | 'futuro' | null): void {
    this.orderTypeSource.next(type);
  }

  setPickupDate(date: string): void {
    this.pickupDateSource.next(date);
  }

  setContactPhone(phone: string): void {
    this.contactPhoneSource.next(phone);
  }

  clearAll(): void {
    this.orderTypeSource.next(null);
    this.pickupDateSource.next('');
    this.contactPhoneSource.next('');
  }
}