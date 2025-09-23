// src/app/interceptors/auth.interceptor.ts

import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification'; // Asegúrate de que la ruta sea correcta

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  
  const authService = inject(AuthService);
  // 1. Inyectamos una instancia del servicio de notificaciones
  const notificationService = inject(NotificationService);
  const token = authService.getToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  // 2. CORRECCIÓN CLAVE: Enviamos la petición modificada 'authReq', no la original 'req'.
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        // 3. Usamos la instancia 'notificationService' para llamar al método 'add'.
        notificationService.add('Tu sesión ha caducado. Por favor, inicia sesión de nuevo.', 'error');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
