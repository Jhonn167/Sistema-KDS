import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService, CartItem } from '../../../services/order'; // Importamos CartItem
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent {
  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;

  constructor(
    public orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  confirmOrder(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Por favor, inicia sesión o crea una cuenta para continuar con tu pedido.');
      this.router.navigate(['/login']);
      return;
    }

    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Pedido enviado a la cocina!');
        this.orderService.clearOrder();
        this.router.navigate(['/mis-pedidos']);
      },
      error: (err) => {
        alert('Error al enviar el pedido: ' + err.error.message);
        console.error(err);
      }
    });
  }
}
