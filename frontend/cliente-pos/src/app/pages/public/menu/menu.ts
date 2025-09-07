// src/app/pages/public/menu/menu.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';
import { OrderService } from '../../../services/order';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuComponent implements OnInit {
  products: any[] = [];
  isLoading = true;

  // Observable para mostrar el número de items en el carrito
  cartItemCount$: Observable<number>;

  constructor(
    private productService: ProductService,
    public orderService: OrderService // Lo hacemos público para usarlo en el HTML
  ) {
    // Nos suscribimos al stream de la orden para saber cuántos items únicos hay
    this.cartItemCount$ = this.orderService.totalItemCount$;
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el menú:', err);
        this.isLoading = false;
      }
    });
  }
}