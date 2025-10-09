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
  
  orderType: 'inmediato' | 'futuro' | null = null;
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

  ngOnInit(): void {
    // La lógica para establecer la fecha se mueve a onOrderTypeSelected
  }

  onOrderTypeSelected(type: 'inmediato' | 'futuro'): void {
    this.orderType = type;
    if (type === 'inmediato') {
      this.setPickupTimeForToday();
    } else {
      this.setPickupDateForFuture();
    }
  }

  private setPickupTimeForToday(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // 30 min de antelación
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.minPickupDate = `${hours}:${minutes}`;
    this.pickupDate = this.minPickupDate;
  }

  private setPickupDateForFuture(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    // Hora por defecto para pedidos futuros (ej. 12:00 PM)
    this.minPickupDate = `${year}-${month}-${day}T09:00`; 
    this.pickupDate = `${year}-${month}-${day}T12:00`;
  }
  
  private processOrder(isCardPayment: boolean, isTransfer: boolean = false): void {
    if (!this.authService.isLoggedIn()) { alert('Por favor, inicia sesión para continuar.'); this.router.navigate(['/login']); return; }
    if (this.isProcessingPayment) return;

    if (this.orderType === 'futuro' && !this.contactPhone) {
      alert('Por favor, ingresa un número de teléfono de contacto para programar tu pedido.');
      return;
    }
    
    this.isProcessingPayment = true;
    const items = this.orderService.getCurrentOrderItems();
    
    let estatus: string | undefined;
    if (isCardPayment) {
      estatus = 'Esperando Pago';
    } else if (isTransfer) {
      estatus = 'Esperando Comprobante';
    } else {
      estatus = undefined; // Para pago en efectivo, el backend lo pondrá como 'Pendiente'
    }

    const orderData = {
      items,
      tipo_pedido: this.orderType,
      fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null,
      hora_recogida: this.orderType === 'inmediato' ? this.pickupDate : null,
      estatus: estatus,
      telefono_contacto: this.contactPhone || undefined
    };
    
    if (isCardPayment) {
      this.orderService.checkout(orderData).subscribe({
        next: (orderResponse) => {
          this.http.post<{ id: string }>(`${environment.apiUrl}/api/payments/create-checkout-session`, { items, orderId: orderResponse.pedidoId })
            .pipe(switchMap(session => this.stripeService.redirectToCheckout({ sessionId: session.id })))
            .subscribe(result => {
              if (result.error) {
                alert(result.error.message);
                this.isProcessingPayment = false;
              }
            });
        },
        error: (err) => {
          alert('Error al crear el pedido: ' + (err.error?.message || 'Error desconocido'));
          this.isProcessingPayment = false;
        }
      });
    } else if (isTransfer) {
        this.orderService.checkout(orderData).subscribe({
            next: (response) => {
                const newOrderId = response.pedidoId;
                this.orderService.clearOrder();
                this.router.navigate(['/subir-comprobante', newOrderId]);
            },
            error: (err) => {
                alert('Error al iniciar el pedido por transferencia: ' + (err.error?.message || 'Error desconocido'));
                this.isProcessingPayment = false;
            }
        });
    } else { // Pago en Efectivo
      this.orderService.checkout(orderData).subscribe({
        next: () => {
          alert('¡Pedido enviado a la cocina! Pagarás en efectivo al recoger.');
          this.orderService.clearOrder();
          this.router.navigate(['/mis-pedidos']);
        },
        error: (err) => {
          alert('Error al enviar el pedido: ' + (err.error?.message || 'Error desconocido'));
          this.isProcessingPayment = false;
        }
      });
    }
  }

  confirmOrder(): void { this.processOrder(false, false); }
  proceedToCheckout(): void { this.processOrder(true, false); }
  startTransferPayment(): void { this.processOrder(false, true); }
}
