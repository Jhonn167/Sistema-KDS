// src/app/services/order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

// ... (La interfaz OrderItem se queda igual) ...
export interface OrderItem {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
}


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/pedidos';

  private orderItems = new BehaviorSubject<OrderItem[]>([]);
  orderItems$ = this.orderItems.asObservable();

  orderTotal$ = this.orderItems$.pipe(
    map(items => items.reduce((total, item) => total + (item.precio * item.cantidad), 0))
  );

  // --- ↓↓↓ NUEVA LÓGICA AÑADIDA ↓↓↓ ---
  /**
   * Un nuevo Observable que calcula la SUMA de las cantidades de todos los items.
   * Ej: 2 chilaquiles + 1 refresco = 3.
   */
  totalItemCount$: Observable<number> = this.orderItems$.pipe(
    map(items => items.reduce((totalQuantity, item) => totalQuantity + item.cantidad, 0))
  );
  // --- ↑↑↑ FIN DE LA NUEVA LÓGICA ↑↑↑ ---


  constructor() { }

  // ... (El resto de los métodos: addItem, updateItemQuantity, etc., se quedan exactamente igual) ...
  // ... (El resto de los métodos: addItem, updateItemQuantity, etc., se quedan exactamente igual) ...
  addItem(product: any): void {
    const currentItems = this.orderItems.getValue();
    const existingItem = currentItems.find(item => item.producto_id === product.id_producto);

    if (existingItem) {
      if (existingItem.cantidad < product.stock) {
        existingItem.cantidad++;
      }
    } else {
      const newItem: OrderItem = {
        producto_id: product.id_producto,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1,
        stock: product.stock
      };
      currentItems.push(newItem);
    }
    this.orderItems.next([...currentItems]);
  }

  updateItemQuantity(producto_id: number, change: number): void {
    const currentItems = this.orderItems.getValue();
    const itemToUpdate = currentItems.find(item => item.producto_id === producto_id);

    if (itemToUpdate) {
      const newQuantity = itemToUpdate.cantidad + change;
      if (newQuantity > 0 && newQuantity <= itemToUpdate.stock) {
        itemToUpdate.cantidad = newQuantity;
      } else if (newQuantity === 0) {
        this.removeItem(producto_id);
        return;
      }
      this.orderItems.next([...currentItems]);
    }
  }

  removeItem(producto_id: number): void {
    const currentItems = this.orderItems.getValue();
    const updatedItems = currentItems.filter(item => item.producto_id !== producto_id);
    this.orderItems.next(updatedItems);
  }

  clearOrder(): void {
    this.orderItems.next([]);
  }

  checkout(): Observable<any> {
    const currentItems = this.orderItems.getValue();
    const total = currentItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const orderPayload = {
      items: currentItems.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad
      })),
      total: total
    };
    
    return this.http.post(this.apiUrl, orderPayload);
  }
}