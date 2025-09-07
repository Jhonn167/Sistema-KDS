// src/app/pages/admin/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- 1. ASEGÚRATE DE TENER ESTA LÍNEA DE IMPORTACIÓN
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, // <-- 2. ASEGÚRATE DE QUE 'CommonModule' ESTÉ EN ESTE ARRAY
    RouterModule 
  ],
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
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        console.log('Productos cargados:', this.products);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.isLoading = false;
      }
    });
  }
}