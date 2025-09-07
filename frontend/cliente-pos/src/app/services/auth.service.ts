// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // URL de tu backend

  constructor(private http: HttpClient, private router: Router) { }

  login(loginData: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        // Guardamos el token en localStorage al iniciar sesión
        localStorage.setItem('token', response.token);
        localStorage.setItem('user_role', response.rol);
      })
    );
  }

  register(userData: any): Observable<any> {
    // El rol no se envía desde el frontend, el backend lo asignará como 'cliente' por defecto.
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    // Limpiamos localStorage y redirigimos al login
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    // Devuelve true si hay un token, false si no
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'admin';
  }
}