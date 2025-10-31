// src/app/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.show(); // Activa el spinner
  
  return next(req).pipe(
    // finalize() se asegura de que esto se ejecute sin importar si la petición fue exitosa o falló
    finalize(() => loadingService.hide())
  );
};
