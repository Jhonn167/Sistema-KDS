import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../environments/environments';


@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kds.html',
  styleUrls: ['./kds.css']
})
export class Kds implements OnInit, OnDestroy {
  pedidos: any[] = [];
  isLoading = true;
  private intervalId: any;
  private apiUrl = `${environment.apiUrl}/pedidos/cocina`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPedidos(); // Carga los pedidos la primera vez
    // Configura un intervalo para refrescar los pedidos cada 15 segundos
    this.intervalId = setInterval(() => {
      this.cargarPedidos();
    }, 10000); // 15000 milisegundos = 10 segundos
  }

  ngOnDestroy(): void {
    // MUY IMPORTANTE: Limpiar el intervalo cuando el componente se destruye para evitar fugas de memoria
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarPedidos(): void {
    this.http.get<any[]>(this.apiUrl).subscribe(data => {
      this.pedidos = data;
      this.isLoading = false;
    });
  }

  actualizarEstatus(id: number, nuevoEstatus: string): void {
    this.http.put(`${this.apiUrl}/${id}`, { estatus: nuevoEstatus }).subscribe(() => {
      // Una vez actualizado, volvemos a cargar los pedidos para que el pedido actualizado desaparezca de la pantalla
      this.cargarPedidos();
    });
  }
}