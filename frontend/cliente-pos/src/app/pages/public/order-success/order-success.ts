// src/app/pages/public/order-success/order-success.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order'; // 1. Importamos el OrderService

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success.css']
})
export class OrderSuccessComponent implements OnInit {

  // 2. Inyectamos el OrderService en el constructor
  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    // 3. En cuanto la página se carga, le decimos al servicio que limpie el carrito.
    console.log('Página de éxito cargada. Limpiando el carrito...');
    this.orderService.clearOrder();
  }
}
