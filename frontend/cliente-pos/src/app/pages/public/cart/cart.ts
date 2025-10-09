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

  // Las funciones de pago se mantienen igual
  confirmOrder(): void { /* ... tu lógica de pago en efectivo ... */ }
  proceedToCheckout(): void { /* ... tu lógica de pago con tarjeta ... */ }
  startTransferPayment(): void { /* ... tu lógica de pago por transferencia ... */ }
}