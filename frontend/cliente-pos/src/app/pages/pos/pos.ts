// src/app/pages/pos/pos.component.ts

import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { OrderService, OrderItem } from '../../services/order'; // Asegúrate de que OrderItem esté exportado
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
  
  orderItems$: Observable<OrderItem[]>;
  orderTotal$: Observable<number>;

  constructor(
    private productService: ProductService,
    public orderService: OrderService
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  ngOnInit(): void {
    console.log('POS Component: Iniciando carga de productos...'); // <--- ESPÍA #1
    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('POS Component: Productos recibidos del servicio:', data); // <--- ESPÍA #2
        this.products = data;
      },
      error: (err) => {
        console.error('POS Component: Error al cargar productos:', err); // <--- ESPÍA #3
      }
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