
// src/app/pages/public/cart/cart.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService, CartItem } from '../../../services/order';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StripeService } from 'ngx-StripeService';
import { environment } from '../../../../environments/environments';

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
  
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private stripeService = inject(StripeService);

  constructor() {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Por favor, inicia sesión o crea una cuenta para pagar.');
      this.router.navigate(['/login']);
      return;
    }

    const items = this.orderService.getCurrentOrderItems(); // Necesitarás añadir este método a tu OrderService

    // Creamos la sesión de checkout en nuestro backend
    this.http.post<{ id: string }>(`${environment.apiUrl}/payments/create-checkout-session`, { items })
      .pipe(
        // Usamos switchMap para encadenar la redirección de Stripe
        switchMap(session => {
          return this.stripeService.redirectToCheckout({ sessionId: session.id });
        })
      )
      .subscribe(result => {
        // Si hay un error en la redirección, se mostrará aquí
        if (result.error) {
          alert(result.error.message);
        }
      });
  }
}