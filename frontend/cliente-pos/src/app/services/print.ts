// src/app/services/print.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private readonly storageKey = 'kds_ticket_data';

  constructor() { }

  // El POS llamará a esta función para GUARDAR los datos del ticket
  setTicketData(data: any): void {
    // Convertimos el objeto de datos a un string JSON y lo guardamos
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // El componente del ticket llamará a esta función para LEER los datos
  getTicketData(): any {
    const dataString = localStorage.getItem(this.storageKey);
    if (!dataString) {
      return null;
    }
    // Una vez leídos los datos, los eliminamos para no volver a imprimirlos por error
    localStorage.removeItem(this.storageKey);
    // Convertimos el string JSON de vuelta a un objeto
    return JSON.parse(dataString);
  }
}
