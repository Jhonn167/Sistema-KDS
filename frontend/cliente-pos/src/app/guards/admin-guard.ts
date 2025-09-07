// src/app/guards/admin.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const isAdmin = this.authService.isAdmin();
    
    // Vamos a obtener el valor crudo directamente para inspeccionarlo
    const userRoleFromStorage = localStorage.getItem('user_role');

    // Imprimimos todo en la consola para ver qué está pasando
    console.log('--- Verificando AdminGuard ---');
    console.log('¿Está logueado? (isLoggedIn devolvió):', isLoggedIn);
    console.log('¿Es admin? (isAdmin devolvió):', isAdmin);
    // Imprimimos el rol entre comillas para poder ver espacios en blanco
    console.log("Valor crudo de 'user_role' en localStorage:", `'${userRoleFromStorage}'`); 
    
    if (isLoggedIn && isAdmin) {
      console.log('Resultado: ACCESO PERMITIDO');
      console.log('---------------------------');
      return true;
    } else {
      console.log('Resultado: ACCESO DENEGADO. Redirigiendo a /login...');
      console.log('---------------------------');
      this.router.navigate(['/login']);
      return false;
    }
  }
}