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
    this.orderUpdatesSub = this.socket.fromEvent('pedido_actualizado_cocina').subscribe(() => this.cargarPedidos());
    this.socket.fromEvent('nuevo_pedido_cocina').subscribe(() => this.cargarPedidos());
    
    // El temporizador ahora se ejecuta cada segundo para un cronómetro más preciso
    this.timerSub = interval(1000).subscribe(() => this.updateTimestamps());
  }

  ngOnDestroy(): void {
    this.orderUpdatesSub?.unsubscribe();
    this.timerSub?.unsubscribe();
  }

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
    let startTime: number;

    if (pedido.estatus === 'En Preparación' && pedido.preparacion_iniciada_en) {
      // Tiempo cocinando: desde que se inició la preparación
      startTime = new Date(pedido.preparacion_iniciada_en).getTime();
      pedido.cronometroLabel = 'Tiempo cocinando';
    } else if (pedido.estatus === 'Pendiente' || pedido.estatus === 'Programado') {
      // Tiempo en espera: desde que llegó el pedido
      startTime = new Date(pedido.fecha).getTime();
      pedido.cronometroLabel = 'Tiempo en espera';
    } else {
      // Para otros estados, no mostrar cronómetro
      pedido.tiempo_transcurrido = '';
      pedido.cronometroLabel = '';
      return;
    }

    const secondsElapsed = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    pedido.tiempo_transcurrido = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
}

  actualizarEstatus(id: number, nuevoEstatus: string): void {
  this.orderService.updateOrderStatus(id, nuevoEstatus).subscribe(() => {
    const pedido = this.pedidos.find(p => p.id_pedido === id);
    if (pedido && nuevoEstatus === 'En Preparación') {
      // Guardamos el momento exacto en que inicia la preparación
      pedido.preparacion_iniciada_en = new Date().toISOString();
    }
    pedido.estatus = nuevoEstatus;
  });
}
}
