import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order';

@Component({
  selector: 'app-payment-confirmations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-confirmations.html',
  styleUrls: ['./payment-confirmations.css']
})
export class PaymentConfirmationsComponent implements OnInit {
  pendingOrders: any[] = [];
  isLoading = true;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadPendingOrders();
  }

  loadPendingOrders(): void {
    this.isLoading = true;
    this.orderService.getPendingConfirmationOrders().subscribe({
      next: (data) => {
        this.pendingOrders = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  confirmPayment(orderId: string): void {
    if (confirm('¿Estás seguro de que quieres confirmar este pago y enviar el pedido a la cocina?')) {
      this.orderService.confirmTransferPayment(orderId).subscribe(() => {
        alert('Pago confirmado. El pedido ha sido enviado a la cocina.');
        this.loadPendingOrders(); // Recarga la lista para que el pedido desaparezca
      });
    }
  }
}
