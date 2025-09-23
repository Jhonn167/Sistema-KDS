// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  static add(arg0: string, arg1: string) {
    throw new Error('Method not implemented.');
  }
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();

  private notificationId = 0;

  add(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = this.notificationId++;
    const currentNotifications = this.notifications.getValue();
    this.notifications.next([...currentNotifications, { id, message, type }]);

    // La notificación desaparece automáticamente después de 5 segundos
    setTimeout(() => this.remove(id), 5000);
  }

  remove(id: number): void {
    const updatedNotifications = this.notifications.getValue().filter(n => n.id !== id);
    this.notifications.next(updatedNotifications);
  }
}
