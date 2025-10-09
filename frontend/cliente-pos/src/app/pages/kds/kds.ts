// src/app/pages/kds/kds.component.ts

// src/app/pages/kds/kds.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order';
import { Socket } from 'ngx-socket-io';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kds.html',
  styleUrls: ['./kds.css']
})
export class KdsComponent implements OnInit, OnDestroy {
  pedidos: any[] = [];
  isLoading = true;
  private orderUpdatesSub: Subscription | undefined;
  private timerSub: Subscription | undefined;

  constructor(private orderService: OrderService, private socket: Socket) {}

  ngOnInit(): void {
    this.cargarPedidos();

    this.orderUpdatesSub = this.socket.fromEvent('pedido_actualizado_cocina').subscribe(() => {
        this.cargarPedidos();
    });
    this.socket.fromEvent('nuevo_pedido_cocina').subscribe(() => {
        this.cargarPedidos();
    });

    // 2. Creamos un temporizador que se ejecuta cada minuto
    this.timerSub = interval(60000).subscribe(() => {
      this.updateTimestamps();
    });
  }

  ngOnDestroy(): void { /* ... */ }

  cargarPedidos(): void {
    this.isLoading = true;
    this.orderService.getKitchenOrders().subscribe(data => {
      this.pedidos = data;
      this.updateTimestamps();
      this.isLoading = false;
    });
  }

  private updateTimestamps(): void {
    const now = Date.now();
    this.pedidos.forEach(pedido => {
      // Solo calculamos el tiempo transcurrido para pedidos que no son programados
      if (pedido.estatus !== 'Programado') {
        const orderTime = new Date(pedido.fecha).getTime();
        const minutesAgo = Math.round((now - orderTime) / 60000);
        pedido.tiempo_transcurrido = `${minutesAgo} min`;
      }
    });
  }

  actualizarEstatus(id: number, nuevoEstatus: string): void {
    this.orderService.updateOrderStatus(id, nuevoEstatus).subscribe();
  }
}