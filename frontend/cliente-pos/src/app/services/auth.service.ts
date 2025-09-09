// src/app/services/auth.service.ts - VERSIÓN FINAL Y COMPLETA

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private socket: Socket
  ) {}

  // --- MÉTODOS DE WEBSOCKETS ---
  connectSocket(): void {
    const userId = this.getUserId();
    if (userId) {
      this.socket.connect();
      this.socket.emit('join', userId);
    }
  }

  disconnectSocket(): void {
    this.socket.disconnect();
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---
  login(loginData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user_role', response.rol);
          localStorage.setItem('user_id', response.userId);
          
          this.connectSocket();
        }
      })
    );
  }

  // --- MÉTODO 'register' (RESTAURADO) ---
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    this.disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    this.router.navigate(['/login']);
  }
  
  // --- MÉTODOS AUXILIARES ---
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'admin';
  }
}