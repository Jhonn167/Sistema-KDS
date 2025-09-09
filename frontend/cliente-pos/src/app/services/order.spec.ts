// src/app/services/order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

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
  private storageKey = 'kds_cart'; // <-- NUEVO: Llave para guardar en localStorage

  private orderItems = new BehaviorSubject<OrderItem[]>([]);
  orderItems$ = this.orderItems.asObservable();

  orderTotal$ = this.orderItems$.pipe(
    map(items => items.reduce((total, item) => total + (item.precio * item.cantidad), 0))
  );
  
  totalItemCount$: Observable<number> = this.orderItems$.pipe(
    map(items => items.reduce((totalQuantity, item) => totalQuantity + item.cantidad, 0))
  );

  constructor() {
    // <-- MODIFICADO: Ahora el constructor carga el carrito guardado
    const storedCart = localStorage.getItem(this.storageKey);
    if (storedCart) {
      this.orderItems.next(JSON.parse(storedCart));
    }
  }

  // <-- NUEVO: Función privada para guardar el carrito en localStorage
  private saveCartToStorage(items: OrderItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

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
    
    const updatedItems = [...currentItems];
    this.orderItems.next(updatedItems);
    this.saveCartToStorage(updatedItems); // <-- MODIFICADO: Guardamos en storage
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

      const updatedItems = [...currentItems];
      this.orderItems.next(updatedItems);
      this.saveCartToStorage(updatedItems); // <-- MODIFICADO: Guardamos en storage
    }
  }

  removeItem(producto_id: number): void {
    const currentItems = this.orderItems.getValue();
    const updatedItems = currentItems.filter(item => item.producto_id !== producto_id);
    this.orderItems.next(updatedItems);
    this.saveCartToStorage(updatedItems); // <-- MODIFICADO: Guardamos en storage
  }

  clearOrder(): void {
    this.orderItems.next([]);
    localStorage.removeItem(this.storageKey); // <-- MODIFICADO: Limpiamos el storage
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

  // Este método lo necesitarás para la página 'Mis Pedidos'
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-pedidos`);
  }
}