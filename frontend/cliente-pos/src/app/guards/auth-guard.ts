// src/app/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Este es un guard funcional, el nuevo estándar de Angular
export const authGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  // Solo preguntamos si el usuario ha iniciado sesión
  if (authService.isLoggedIn()) {
    return true; // Si ha iniciado sesión, puede pasar
  }

  // Si no, lo redirigimos al login
  router.navigate(['/login']);
  return false;
};