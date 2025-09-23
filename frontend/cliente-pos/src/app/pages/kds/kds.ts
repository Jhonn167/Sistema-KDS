// src/app/pages/kds/kds.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
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
  private apiUrl = `${environment.apiUrl}/pedidos/cocina`;

  constructor(private http: HttpClient, private socket: Socket) {}

  ngOnInit(): void {
    this.cargarPedidos(); // Carga los pedidos la primera vez al entrar

    // --- LÓGICA DE WEBSOCKETS MEJORADA ---
    // Nos suscribimos a un solo observable que escucha MÚLTIPLES eventos.
    this.orderUpdatesSub = this.socket.fromEvent('pedido_actualizado_cocina').subscribe(() => {
        console.log('KDS: Notificación de actualización de pedido recibida. Recargando...');
        this.cargarPedidos();
    });
    // Por retrocompatibilidad, también escuchamos el evento antiguo
    this.socket.fromEvent('nuevo_pedido_cocina').subscribe(() => {
        console.log('KDS: Notificación de nuevo pedido recibida. Recargando...');
        this.cargarPedidos();
    });
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción al destruir el componente
    if (this.orderUpdatesSub) {
      this.orderUpdatesSub.unsubscribe();
    }
  }

  cargarPedidos(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiUrl).subscribe(data => {
      this.pedidos = data;
      this.isLoading = false;
    });
  }

  actualizarEstatus(id: number, nuevoEstatus: string): void {
    // La llamada a la API es la misma. El backend se encargará de notificar.
    this.http.put(`${this.apiUrl}/${id}`, { estatus: nuevoEstatus }).subscribe({
        next: () => {
            // Opcional: Podemos forzar una recarga local para una respuesta visual más rápida
            // en lugar de esperar al evento del socket, aunque no es estrictamente necesario.
            this.cargarPedidos();
        },
        error: (err) => console.error("Error al actualizar estatus:", err)
    });
  }
}
