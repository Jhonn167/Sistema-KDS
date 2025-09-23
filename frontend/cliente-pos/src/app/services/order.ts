import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

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

  // --- MÉTODO addItem ACTUALIZADO CON VERIFICACIÓN DE STOCK ---
  addItem(configuredProduct: any): void {
    const currentItems = this.orderItems.getValue();
    
    // Buscamos si ya existe un item idéntico (mismo producto Y mismas opciones)
    const existingItem = currentItems.find(item => 
        item.producto_id === configuredProduct.id_producto &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(configuredProduct.selectedOptions || [])
    );

    if (existingItem) {
      // Si ya existe, solo incrementamos la cantidad SI HAY STOCK DISPONIBLE
      if (existingItem.cantidad < existingItem.stock) {
        existingItem.cantidad++;
      } else {
        alert(`No puedes añadir más de este producto. Stock disponible: ${existingItem.stock}`);
        return; // Detenemos la función aquí
      }
    } else {
      // Si no existe, creamos un nuevo item
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
  }

  // en src/app/services/order.service.ts

checkout(additionalData: { hora_recogida?: string | null, estatus?: string, tipo_pedido?: string, fecha_recogida?: string | null } = {}): Observable<any> {
    const currentItems = this.orderItems.getValue();
    
    // El payload ahora es completamente dinámico
    const payload = {
      items: currentItems.map(item => ({
        // Enviamos todos los datos del item para un cálculo de total seguro en el backend
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precioFinal: item.precioFinal, 
        selectedOptions: item.selectedOptions
      })),
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
  // en src/app/services/order.service.ts

// ... (otros métodos)

// --- MÉTODOS NUEVOS PARA EL ADMIN ---
getPendingConfirmationOrders(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/pending-confirmation`);
}

confirmTransferPayment(orderId: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/confirm-transfer/${orderId}`, {});
}

}


