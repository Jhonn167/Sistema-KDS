// src/app/services/order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';
import { CartStateService } from './cart-state';

export interface CartItem {
  cartItemId: string;
  producto_id: number;
  nombre: string;
  cantidad: number;
  precioBase: number;
  precioFinal: number;
  stock: number;
  selectedOptions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/pedidos`;
  private storageKey = 'kds_cart';
  private cartStateService = inject(CartStateService);

  private orderItems = new BehaviorSubject<CartItem[]>([]);
  orderItems$ = this.orderItems.asObservable();

  orderTotal$ = this.orderItems$.pipe(
    map(items => items.reduce((total, item) => total + (item.precioFinal * item.cantidad), 0))
  );
  
  totalItemCount$: Observable<number> = this.orderItems$.pipe(
    map(items => items.reduce((totalQuantity, item) => totalQuantity + item.cantidad, 0))
  );

  constructor() {
    const storedCart = localStorage.getItem(this.storageKey);
    if (storedCart) {
      this.orderItems.next(JSON.parse(storedCart));
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  addItem(configuredProduct: any): void {
    const currentItems = this.orderItems.getValue();
    const existingItem = currentItems.find(item => 
        item.producto_id === configuredProduct.id_producto &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(configuredProduct.selectedOptions || [])
    );
    if (existingItem) {
      if (existingItem.cantidad < existingItem.stock) {
        existingItem.cantidad++;
      } else {
        alert(`No puedes añadir más de este producto. Stock disponible: ${existingItem.stock}`);
        return;
      }
    } else {
      const newItem: CartItem = {
        cartItemId: Date.now().toString(),
        producto_id: configuredProduct.id_producto,
        nombre: configuredProduct.nombre,
        cantidad: 1,
        precioBase: configuredProduct.precio,
        precioFinal: configuredProduct.finalPrice,
        stock: configuredProduct.stock,
        selectedOptions: configuredProduct.selectedOptions || []
      };
      currentItems.push(newItem);
    }
    const updatedItems = [...currentItems];
    this.orderItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  updateItemQuantity(cartItemId: string, change: number): void {
    const currentItems = this.orderItems.getValue();
    const itemToUpdate = currentItems.find(item => item.cartItemId === cartItemId);
    if (itemToUpdate) {
      const newQuantity = itemToUpdate.cantidad + change;
      if (newQuantity > 0 && newQuantity <= itemToUpdate.stock) {
        itemToUpdate.cantidad = newQuantity;
      } else if (newQuantity > itemToUpdate.stock) {
        alert(`No puedes añadir más de este producto. Stock disponible: ${itemToUpdate.stock}`);
      } else if (newQuantity === 0) {
        this.removeItem(cartItemId);
        return;
      }
      this.orderItems.next([...currentItems]);
      this.saveCartToStorage([...currentItems]);
    }
  }

  removeItem(cartItemId: string): void {
    const currentItems = this.orderItems.getValue();
    const updatedItems = currentItems.filter(item => item.cartItemId !== cartItemId);
    this.orderItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  clearOrder(): void {
    this.orderItems.next([]);
    localStorage.removeItem(this.storageKey);
    this.cartStateService.clearOrderType();
  }

  checkout(additionalData: any = {}): Observable<any> {
    const currentItems = this.orderItems.getValue();
    const payload = {
      items: currentItems,
      ...additionalData
    };
    return this.http.post(this.apiUrl, payload);
  }
  
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-pedidos`);
  }

  public getCurrentOrderItems(): CartItem[] {
    return this.orderItems.getValue();
  }

  getPendingConfirmationOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending-confirmation`);
  }

  confirmTransferPayment(orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirm-transfer/${orderId}`, {});
  }

// --- MÉTODO NUEVO PARA EL KDS ---
  getKitchenOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cocina`);
  }
  
  // --- MÉTODO NUEVO PARA ACTUALIZAR ESTATUS DESDE EL KDS ---
  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cocina/${orderId}`, { estatus: newStatus });
  }
}
