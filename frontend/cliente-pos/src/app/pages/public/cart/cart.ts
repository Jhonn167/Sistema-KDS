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

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;
  
  orderType: 'inmediato' | 'futuro' = 'inmediato';
  pickupDate: string = '';
  minPickupDate: string = '';
  isProcessingPayment = false;
  
  // Propiedad auxiliar para restaurar la fecha si la selección es inválida
  private pickupDateAux: string = '';

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
    this.setMinPickupDate();
  }

  private setMinPickupDate(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Margen de 30 minutos
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

    this.minPickupDate = localDateTimeString;
    this.pickupDate = localDateTimeString;
    this.pickupDateAux = localDateTimeString; // Inicializamos la fecha auxiliar
  }
  
  // --- FUNCIÓN DE VALIDACIÓN RESTAURADA ---
  validatePickupTime(): void {
    if (this.pickupDate && this.minPickupDate && this.pickupDate < this.minPickupDate) {
      alert('La hora de recogida no puede ser en el pasado. Hemos ajustado la hora a la más cercana disponible.');
      // Restablece la hora a la última válida conocida
      this.pickupDate = this.pickupDateAux;
    } else {
      // Si la hora es válida, la guardamos como la última correcta
      this.pickupDateAux = this.pickupDate;
    }
  }

  // Flujo para pago en EFECTIVO
  confirmOrder(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Por favor, inicia sesión para confirmar tu pedido.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;

    const orderData = {
      tipo_pedido: this.orderType,
      fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null
    };
    this.orderService.checkout(orderData).subscribe({
        next: () => {
            alert('¡Pedido enviado a la cocina! Pagarás en efectivo al recoger.');
            this.orderService.clearOrder();
            this.router.navigate(['/mis-pedidos']);
        },
        error: (err) => {
            alert('Error al enviar el pedido: ' + err.error.message);
            this.isProcessingPayment = false;
        }
    });
  }

  // Flujo para pago con TARJETA
  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Por favor, inicia sesión para pagar.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;

    const items = this.orderService.getCurrentOrderItems();
    const orderData = {
      tipo_pedido: this.orderType,
      fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null,
      estatus: 'Esperando Pago'
    };
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
        alert('Error al crear el pedido inicial: ' + err.error.message);
        this.isProcessingPayment = false;
      }
    });
  }

  // Flujo para pago por TRANSFERENCIA
  startTransferPayment(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Por favor, inicia sesión para continuar.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isProcessingPayment) return;
    this.isProcessingPayment = true;
    
    const orderData = {
      tipo_pedido: this.orderType,
      fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : null,
      estatus: 'Esperando Comprobante'
    };
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
