// src/app/pages/public/my-orders/my-orders.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  isLoading = true;
  private statusUpdateSub: Subscription | undefined;

  constructor(private orderService: OrderService, private socket: Socket) {}

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders = data.map(order => ({
          ...order,
          total: parseFloat(order.total)
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar mis pedidos:', err);
        this.isLoading = false;
      }
    });

    this.statusUpdateSub = this.socket.fromEvent<any>('estatus_actualizado').subscribe(data => {
      const orderToUpdate = this.orders.find(order => order.id_pedido == data.pedidoId);
      if (orderToUpdate) {
        orderToUpdate.estatus = data.nuevoEstatus;
      }
    });
  }

  // --- FUNCIÓN NUEVA PARA MANEJAR LA LÓGICA DEL TEMPLATE ---
  // Esta función toma el estatus y devuelve un nombre de clase CSS válido.
  getStatusClass(status: string): string {
    if (!status) {
      return '';
    }
    return status.toLowerCase().replace(/ /g, '-');
  }

  ngOnDestroy(): void {
    if (this.statusUpdateSub) {
      this.statusUpdateSub.unsubscribe();
    }
  }
}
