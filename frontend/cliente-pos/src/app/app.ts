// src/app/app.component.ts - VERSIÓN SIMPLIFICADA

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  title = 'cliente-pos';

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Al iniciar la app, le pedimos al AuthService que intente conectar el socket
    // si ya existía una sesión de usuario.
    this.authService.connectSocket();
  }
}