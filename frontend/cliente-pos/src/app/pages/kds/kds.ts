// src/app/pages/kds/kds.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Socket } from 'ngx-socket-io';
import { Subscription, interval } from 'rxjs'; // 1. Importa 'interval'

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
  private timerSub: Subscription | undefined; // Para el temporizador
  private apiUrl = `${environment.apiUrl}/api/pedidos`;

  constructor(private http: HttpClient, private socket: Socket) {}

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

  ngOnDestroy(): void {
    this.orderUpdatesSub?.unsubscribe();
    this.timerSub?.unsubscribe(); // 3. Limpiamos el temporizador
  }

  cargarPedidos(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/cocina`).subscribe(data => {
      this.pedidos = data;
      this.updateTimestamps(); // Calculamos los tiempos al cargar
      this.isLoading = false;
    });
  }

  // 4. Nueva función para calcular el tiempo transcurrido
  private updateTimestamps(): void {
    const now = Date.now();
    this.pedidos.forEach(pedido => {
      const orderTime = new Date(pedido.fecha).getTime();
      const minutesAgo = Math.round((now - orderTime) / 60000);
      pedido.tiempo_transcurrido = `${minutesAgo} min`;
    });
  }

  actualizarEstatus(id: number, nuevoEstatus: string): void {
    this.http.put(`${this.apiUrl}/cocina/${id}`, { estatus: nuevoEstatus }).subscribe({
        next: () => this.cargarPedidos(),
        error: (err) => console.error("Error al actualizar estatus:", err)
    });
  }
}
