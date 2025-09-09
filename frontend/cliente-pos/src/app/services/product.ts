// src/app/services/product.service.ts - VERSIÓN COMPLETA Y ACTUALIZADA

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // CAMBIO: Ahora usamos la URL base de la API desde el archivo de entorno.
  // Esto hace que el servicio sea más flexible.
  private apiUrl = environment.apiUrl; 

  constructor(private http: HttpClient) { }

  /**
   * Obtiene una lista de todos los productos.
   */
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }

  /**
   * Obtiene un solo producto por su ID.
   */
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  /**
   * Crea un nuevo producto en la base de datos.
   */
  createProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, product);
  }

  /**
   * Actualiza un producto existente.
   */
  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, product);
  }

  /**
   * Elimina un producto por su ID.
   * (Lo usaremos en el futuro si añadimos un botón de eliminar).
   */
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }

  /**
   * NUEVO MÉTODO: Sube un archivo de imagen al backend.
   * Usa FormData, que es el formato especial para enviar archivos.
   */
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }
}