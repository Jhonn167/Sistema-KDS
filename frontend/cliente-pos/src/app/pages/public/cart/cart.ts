// src/app/pages/public/cart/cart.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService, CartItem } from '../../../services/order';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StripeService } from 'ngx-stripe';
import { environment } from '../../../../environments/environments';
import { FormsModule } from '@angular/forms';
import { OrderTypeModalComponent } from '../../../components/order-type-modal/order-type-modal';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderTypeModalComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;
  
  orderType: 'inmediato' | 'futuro' | null = null; // Inicia como nulo para mostrar el modal
  pickupDate: string = '';
  minPickupDate: string = '';
  isProcessingPayment = false;
  contactPhone: string = '';
  maxQuantity = 50;
  
  constructor(
    public orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private stripeService: StripeService
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  ngOnInit(): void {}

  // Se ejecuta cuando el modal emite una opción
  onOrderTypeSelected(type: 'inmediato' | 'futuro'): void {
    this.orderType = type;
    if (type === 'inmediato') {
      this.setPickupDateForToday();
    } else {
      this.setPickupDateForFuture();
    }
  }

  // Lógica para bloquear el calendario solo para el día de hoy
  private setPickupDateForToday(): void {
    const now = new Date();
    this.minPickupDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    this.pickupDate = this.minPickupDate;
  }

  // Lógica para el calendario de pedidos futuros
  private setPickupDateForFuture(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minPickupDate = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
    this.pickupDate = this.minPickupDate;
  }
  // ... (tus funciones de pago: confirmOrder, proceedToCheckout, startTransferPayment)



  confirmOrder(): void {
    if (!this.authService.isLoggedIn()) { alert('Por favor, inicia sesión para confirmar tu pedido.'); this.router.navigate(['/login']); return; }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;
    const orderData = { tipo_pedido: this.orderType, fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null };
    this.orderService.checkout(orderData).subscribe({
      next: () => {
        alert('¡Pedido enviado a la cocina! Pagarás en efectivo al recoger.');
        this.orderService.clearOrder();
        this.router.navigate(['/mis-pedidos']);
      },
      error: (err) => {
        alert('Error al enviar el pedido: ' + (err.error.message || 'Error desconocido'));
        this.isProcessingPayment = false;
      }
    });
  }

  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) { alert('Por favor, inicia sesión para pagar.'); this.router.navigate(['/login']); return; }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;
    const items = this.orderService.getCurrentOrderItems();
    const orderData = { tipo_pedido: this.orderType, fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null, estatus: 'Esperando Pago' };
    this.orderService.checkout(orderData).subscribe({
      next: (orderResponse) => {
        const orderId = orderResponse.pedidoId;
        this.http.post<{ id: string }>(`${environment.apiUrl}/api/payments/create-checkout-session`, { items, orderId })
          .pipe(switchMap(session => this.stripeService.redirectToCheckout({ sessionId: session.id })))
          .subscribe(result => {
            if (result.error) {
              alert(result.error.message);
              this.isProcessingPayment = false;
            }
          });
      },
      error: (err) => {
        alert('Error al crear el pedido inicial: ' + (err.error.message || 'Error desconocido'));
        this.isProcessingPayment = false;
      }
    });
  }

  startTransferPayment(): void {
    if (!this.authService.isLoggedIn()) { alert('Por favor, inicia sesión para continuar.'); this.router.navigate(['/login']); return; }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;
    const orderData = { tipo_pedido: this.orderType, fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null, estatus: 'Esperando Comprobante' };
    this.orderService.checkout(orderData).subscribe({
      next: (response) => {
        const newOrderId = response.pedidoId;
        this.orderService.clearOrder();
        this.router.navigate(['/subir-comprobante', newOrderId]);
      },
      error: (err) => {
        alert('Error al iniciar el pedido por transferencia.');
        this.isProcessingPayment = false;
      }
    });
  }
}
