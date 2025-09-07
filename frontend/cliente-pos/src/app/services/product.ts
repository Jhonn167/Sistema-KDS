// src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene una lista de todos los productos.
   * ESTE MÉTODO YA LO TIENES.
   */
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- AÑADE LOS SIGUIENTES MÉTODOS ---

  /**
   * Obtiene un solo producto por su ID.
   * ESTE ES EL MÉTODO QUE TE FALTA AHORA.
   */
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo producto en la base de datos.
   * LO NECESITARÁS PARA GUARDAR EL FORMULARIO DE CREACIÓN.
   */
  createProduct(product: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, product);
  }

  /**
   * Actualiza un producto existente.
   * LO NECESITARÁS PARA GUARDAR EL FORMULARIO DE EDICIÓN.
   */
  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, product);
  }

  /**
   * Elimina un producto por su ID.
   * (Lo usaremos más adelante si quieres añadir un botón de eliminar).
   */
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}