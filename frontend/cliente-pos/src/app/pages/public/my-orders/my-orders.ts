// src/app/pages/public/my-orders/my-orders.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order';
import { Socket } from 'ngx-socket-io'; // 1. IMPORTA EL SOCKET
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  isLoading = true;
  private statusUpdateSub: Subscription | undefined;

  // 2. INYECTA EL SOCKET
  constructor(private orderService: OrderService, private socket: Socket) {}

  ngOnInit(): void {
    // Primero, cargamos la lista inicial de pedidos
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar mis pedidos:', err);
        this.isLoading = false;
      }
    });

    // 3. NOS SUSCRIBIMOS AL EVENTO DE ACTUALIZACIÓN DE ESTATUS
    this.statusUpdateSub = this.socket.fromEvent<any>('estatus_actualizado').subscribe(data => {
      console.log('¡Actualización de estatus recibida!', data);
      
      // Buscamos el pedido en nuestra lista local
      const orderToUpdate = this.orders.find(order => order.id_pedido == data.pedidoId);
      if (orderToUpdate) {
        // Y actualizamos su estatus en la pantalla, ¡sin recargar la página!
        orderToUpdate.estatus = data.nuevoEstatus;
      }
    });
  }

  ngOnDestroy(): void {
    // 4. Limpiamos la suscripción al destruir el componente
    if (this.statusUpdateSub) {
      this.statusUpdateSub.unsubscribe();
    }
  }
}