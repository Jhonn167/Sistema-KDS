// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();
  private notificationId = 0;

  add(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Limpiamos las notificaciones existentes para mostrar solo la última
    this.notifications.next([]);
    
    const id = this.notificationId++;
    this.notifications.next([{ id, message, type }]);

    // La notificación desaparece automáticamente después de 3 segundos
    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: number): void {
    const updatedNotifications = this.notifications.getValue().filter(n => n.id !== id);
    this.notifications.next(updatedNotifications);
  }
}
