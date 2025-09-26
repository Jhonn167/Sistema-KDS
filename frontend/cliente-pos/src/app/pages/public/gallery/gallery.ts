// src/app/pages/public/gallery/gallery.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importamos RouterModule para el botón
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule], // Añadimos RouterModule
  templateUrl: './gallery.html',
  styleUrls: ['./gallery.css']
})
export class GalleryComponent implements OnInit {
  products: any[] = [];
  isLoading = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Obtenemos los productos que están activos y tienen una imagen
    this.productService.getProducts().subscribe({
      next: (data) => {
        // Filtramos para mostrar solo productos que tengan una imagen asignada
        this.products = data.filter(p => p.imagen_url);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la galería:', err);
        this.isLoading = false;
      }
    });
  }
}
