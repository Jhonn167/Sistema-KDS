// src/app/pages/pos/pos.component.ts

import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
// Asegúrate de que OrderItem esté exportado desde order.service.ts
import { OrderService, OrderItem } from '../../services/order'; 
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pos.html',
  styleUrls: ['./pos.css']
})
export class PosComponent implements OnInit {
  products: any[] = [];
  
  // 1. Declaramos las propiedades aquí, pero no las inicializamos todavía
  orderItems$: Observable<OrderItem[]>;
  orderTotal$: Observable<number>;

  constructor(
    private productService: ProductService,
    public orderService: OrderService 
  ) {
    // 2. Las inicializamos DENTRO del constructor,
    //    donde 'this.orderService' ya existe y tiene un valor.
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
    });
  }

 onCheckout(): void {
    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Venta registrada exitosamente!');
        this.orderService.clearOrder();
        // Recargamos los productos para ver el stock actualizado
        this.productService.getProducts().subscribe(data => {
          this.products = data;
        });
      },
      error: (err) => {
        alert('Error al registrar la venta: ' + err.error.message);
        console.error(err);
      }
    });
  }
}