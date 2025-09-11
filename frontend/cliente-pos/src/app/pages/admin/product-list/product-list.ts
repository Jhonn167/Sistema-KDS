// src/app/pages/admin/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  isLoading = true;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProductsForAdmin().subscribe({
      next: (data) => { this.products = data; this.isLoading = false; },
      error: (err) => {
        console.error('Error al cargar la lista de productos de admin:', err);
        this.isLoading = false;
        alert('No se pudo cargar la lista de productos.');
      }
    });
  }

  toggleStatus(product: any): void {
    const newStatus = !product.activo;
    const actionText = newStatus ? 'activar' : 'suspender';
    const confirmation = confirm(`¿Estás seguro de que quieres ${actionText} el producto "${product.nombre}"?`);

    if (confirmation) {
      this.productService.updateProductStatus(product.id_producto.toString(), { activo: newStatus }).subscribe({
        next: () => {
          product.activo = newStatus;
        },
        error: (err) => {
          console.error(err);
          alert(`Error al ${actionText} el producto.`);
        }
      });
    }
  }

  // MÉTODO NUEVO: Maneja la eliminación de un producto.
  deleteProduct(product: any): void {
    // Doble confirmación para una acción destructiva.
    const confirmation = confirm(`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE el producto "${product.nombre}"? Esta acción no se puede deshacer.`);

    if (confirmation) {
      this.productService.deleteProduct(product.id_producto.toString()).subscribe({
        next: () => {
          // Eliminamos el producto de la lista local para actualizar la vista instantáneamente.
          this.products = this.products.filter(p => p.id_producto !== product.id_producto);
          alert('Producto eliminado exitosamente.');
        },
        error: (err) => {
          console.error(err);
          alert('Error al eliminar el producto.');
        }
      });
    }
  }
}