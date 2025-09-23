// src/app/components/receipt-ticket/receipt-ticket.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintService } from '../../services/print';

@Component({
  selector: 'app-receipt-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-ticket.html',
  styleUrls: ['./receipt-ticket.css']
})
export class ReceiptTicketComponent implements OnInit {
  ticketData: any = null;

  constructor(private printService: PrintService) {}

  ngOnInit(): void {
    // Al iniciar, obtenemos los datos guardados en localStorage
    this.ticketData = this.printService.getTicketData();

    if (this.ticketData) {
      // Pequeño delay para asegurar que el HTML se renderice antes de imprimir
      setTimeout(() => {
        window.print();
        // Opcional: Cierra la pestaña después de imprimir
        window.close(); 
      }, 500);
    } else {
        // En caso de que no haya datos (ej. si el usuario abre la URL manualmente)
        console.error("No se encontraron datos para imprimir el ticket.");
    }
  }
}
