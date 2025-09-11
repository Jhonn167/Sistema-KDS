import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

// =====> LA CORRECCIÓN ESTÁ EN ESTA LÍNEA <=====
// Añadimos 'export' para que otros archivos puedan importar esta interfaz.
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
  private apiUrl = `${environment.apiUrl}/pedidos`;
  private storageKey = 'kds_cart';

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

    const updatedItems = [...currentItems, newItem];
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
      } else if (newQuantity === 0) {
        this.removeItem(cartItemId);
        return;
      }
      const updatedItems = [...currentItems];
      this.orderItems.next(updatedItems);
      this.saveCartToStorage(updatedItems);
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
  }

  checkout(): Observable<any> {
    const currentItems = this.orderItems.getValue();
    const total = currentItems.reduce((sum, item) => sum + (item.precioFinal * item.cantidad), 0);
    
    const orderPayload = {
      items: currentItems.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
      })),
      total: total
    };
    
    return this.http.post(this.apiUrl, orderPayload);
  }
  
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-pedidos`);
  }
}
