// src/app/services/cart-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  private orderTypeSource = new BehaviorSubject<'inmediato' | 'futuro' | null>(null);
  orderType$ = this.orderTypeSource.asObservable();

  constructor() { }

  setOrderType(type: 'inmediato' | 'futuro'): void {
    this.orderTypeSource.next(type);
  }

  clearOrderType(): void {
    this.orderTypeSource.next(null);
  }
}
