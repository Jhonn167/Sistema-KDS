// src/app/pages/public/cart/cart.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // 1. Importamos Router 
import { OrderService, OrderItem} from './../../../services/order';
import { AuthService } from '../../../services/auth.service'; // 2. Importamos AuthService
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent {
  orderItems$: Observable<OrderItem[]>;
  orderTotal$: Observable<number>;

  // 3. Inyectamos AuthService y Router en el constructor
  constructor(
    public orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  confirmOrder(): void {
    // 4. --- LÓGICA MEJORADA ---
    // Antes de hacer nada, preguntamos si el usuario está logueado
    if (!this.authService.isLoggedIn()) {
      // Si NO está logueado...
      alert('Por favor, inicia sesión o crea una cuenta para continuar con tu pedido.');
      // Lo redirigimos al login.
      this.router.navigate(['/login']);
      return; // Detenemos la función aquí
    }

    // Si SÍ está logueado, el resto del código se ejecuta como antes.
    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Pedido enviado a la cocina! Recibirás una notificación cuando esté listo.');
        this.orderService.clearOrder();
        this.router.navigate(['/mis-pedidos']); // Lo llevamos a ver su historial
      },
      error: (err) => {
        alert('Error al enviar el pedido: ' + err.error.message);
        console.error(err);
      }
    });
  }
}