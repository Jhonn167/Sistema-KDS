// src/app/pages/kds/kds.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';

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

  // 2. Inyecta OrderService en lugar de HttpClient
  constructor(private orderService: OrderService, private socket: Socket) {}

  ngOnInit(): void {
    this.cargarPedidos();
    this.orderUpdatesSub = this.socket.fromEvent('pedido_actualizado_cocina').subscribe(() => {
        this.cargarPedidos();
    });
    this.socket.fromEvent('nuevo_pedido_cocina').subscribe(() => {
        this.cargarPedidos();
    });
  }

  ngOnDestroy(): void {
    this.orderUpdatesSub?.unsubscribe();
  }

  cargarPedidos(): void {
    this.isLoading = true;
    // 3. Usa el nuevo método del servicio
    this.orderService.getKitchenOrders().subscribe(data => {
      this.pedidos = data;
      this.isLoading = false;
    });
  }

  actualizarEstatus(id: number, nuevoEstatus: string): void {
    // 4. Usa el nuevo método del servicio
    this.orderService.updateOrderStatus(id, nuevoEstatus).subscribe({
        next: () => this.cargarPedidos(),
        error: (err) => console.error("Error al actualizar estatus:", err)
    });
  }
}
