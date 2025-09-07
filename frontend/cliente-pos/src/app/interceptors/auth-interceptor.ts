// src/app/interceptors/auth.interceptor.ts

import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Este es un interceptor funcional, el nuevo estándar en Angular.
 * Ya no es una clase, sino una función exportada.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  
  // Para obtener servicios (como AuthService) dentro de una función,
  // usamos la función `inject()` en lugar de un constructor.
  const authService = inject(AuthService);
  const token = authService.getToken();

  // La lógica de clonar y añadir la cabecera es la misma
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};