// src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }
  
  getProductsForAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/admin`);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, product);
  }

  updateProductStatus(id: string, newStatus: { activo: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/products/${id}/status`, newStatus);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  assignModifiersToProduct(productId: string, modifierGroupIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/modifiers`, { modifierGroupIds });
  }
}
