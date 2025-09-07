// src/app/pages/public/cart/cart.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, OrderItem } from '../../../services/order';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent {
  // Exponemos los observables del servicio directamente a la plantilla
  orderItems$: Observable<OrderItem[]>;
  orderTotal$: Observable<number>;

  constructor(public orderService: OrderService) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  confirmOrder(): void {
    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Pedido enviado a la cocina! Recibirás una notificación cuando esté listo.');
        this.orderService.clearOrder();
        // Aquí podríamos redirigir al usuario a la página de "Mis Pedidos"
        // this.router.navigate(['/mis-pedidos']);
      },
      error: (err) => {
        alert('Error al enviar el pedido: ' + err.error.message);
        console.error(err);
      }
    });
  }
}