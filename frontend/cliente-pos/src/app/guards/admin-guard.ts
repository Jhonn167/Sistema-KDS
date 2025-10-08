// src/app/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtenemos los roles permitidos desde la data de la ruta
  const allowedRoles = route.data['roles'] as Array<string>;

  if (authService.isLoggedIn() && authService.hasRole(allowedRoles)) {
    return true;
  }

  // Si no tiene el rol, lo redirigimos al login
  router.navigate(['/login']);
  return false;
};
