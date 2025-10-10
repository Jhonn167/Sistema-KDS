// src/app/pages/public/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService, CartItem } from '../../../services/order';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StripeService } from 'ngx-stripe';
import { environment } from '../../../../environments/environments';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { OrderTypeModalComponent } from '../../../components/order-type-modal/order-type-modal';
import { CartStateService } from '../../../services/cart-state';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderTypeModalComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit, OnDestroy {
  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;

  orderType: 'inmediato' | 'futuro' | null = null;
  pickupDate: string = '';
  minPickupDate: string = '';
  contactPhone: string = '';
  pickupDateAux: string = '';

  isProcessingPayment = false;
  maxQuantity = 50;
  private stateSub: Subscription | undefined;

  carritoForm: FormGroup;

  constructor(
    public orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private stripeService: StripeService,
    private cartStateService: CartStateService,
        private fb: FormBuilder

  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;

    this.carritoForm = this.fb.group({
      fecha: ['', [Validators.required]],
      telefono: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Nos suscribimos al estado guardado para mantener la consistencia
    this.stateSub = this.cartStateService.orderType$.subscribe(type => {
      this.orderType = type;
      if (type) this.initializeDatePickers(type);
    });
    this.cartStateService.pickupDate$.subscribe(date => this.pickupDate = date);
    this.cartStateService.contactPhone$.subscribe(phone => this.contactPhone = phone);
  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
  }

  onOrderTypeSelected(type: 'inmediato' | 'futuro'): void {
    this.cartStateService.setOrderType(type);
  }

  onPickupDateChange(date: string): void {
    this.cartStateService.setPickupDate(date);
  }

  onContactPhoneChange(phone: string): void {
    this.cartStateService.setContactPhone(phone);
  }
  canProceedToPayment(): boolean {
    if (this.orderType === 'futuro') {
      const phoneRegex = /^[0-9]{10}$/;
      return phoneRegex.test(this.contactPhone);
    }
    return true;
  }

  private initializeDatePickers(type: 'inmediato' | 'futuro'): void {
    if (type === 'inmediato') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      this.minPickupDate = `${hours}:${minutes}`;
      if (!this.pickupDate || this.pickupDate < this.minPickupDate) {
        this.pickupDate = this.minPickupDate;
      }
      this.pickupDateAux = this.pickupDate;
    } else { // futuro
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const day = tomorrow.getDate().toString().padStart(2, '0');
      this.minPickupDate = `${year}-${month}-${day}T09:00`;
      if (!this.pickupDate || new Date(this.pickupDate) < new Date(this.minPickupDate)) {
        this.pickupDate = `${year}-${month}-${day}T12:00`;
      }
      this.pickupDateAux = this.pickupDate;
    }
  }

  validatePickupTime(): void {
    if (this.pickupDate && this.minPickupDate && this.pickupDate < this.minPickupDate) {
      alert('La hora de recogida no puede ser en el pasado. Hemos ajustado la hora a la más cercana disponible.');
      this.pickupDate = this.pickupDateAux;
    } else {
      this.pickupDateAux = this.pickupDate;
    }
  }

  onKeyUpPhone(){
    
    let telefono = this.carritoForm.controls['telefono'].value;
    console.log(this.contactPhone);
    this.isProcessingPayment = telefono.length > 0;

  }

  private processOrder(isCardPayment: boolean, isTransfer: boolean = false): void {
    if (!this.authService.isLoggedIn()) { alert('Por favor, inicia sesión para continuar.'); this.router.navigate(['/login']); return; }
    if (this.isProcessingPayment) return;

    if (this.orderType === 'futuro') {
      const phoneRegex = /^[0-9]{10}$/;
      if (!this.contactPhone || !phoneRegex.test(this.contactPhone)) {
        alert('Por favor ingresa un número de teléfono válido de 10 dígitos para programar tu pedido.');
        return;
      }
    }

    this.isProcessingPayment = true;
    const items = this.orderService.getCurrentOrderItems();

    let estatus: string | undefined;
    if (isCardPayment) {
      estatus = 'Esperando Pago';
    } else if (isTransfer) {
      estatus = 'Esperando Comprobante';
    }

    const orderData = {
      items,
      tipo_pedido: this.orderType,
      fecha_recogida: this.orderType === 'futuro' ? this.pickupDate : (this.orderType === 'inmediato' ? new Date().toISOString().split('T')[0] + 'T' + this.pickupDate : null),
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
    } else {
      this.orderService.checkout(orderData).subscribe({
        next: (response) => {
          if (isTransfer) {
            this.orderService.clearOrder();
            this.router.navigate(['/subir-comprobante', response.pedidoId]);
          } else {
            alert('¡Pedido enviado a la cocina! Pagarás en efectivo al recoger.');
            this.orderService.clearOrder();
            this.router.navigate(['/mis-pedidos']);
          }
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