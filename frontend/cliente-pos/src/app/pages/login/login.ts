// src/app/pages/login/login.component.ts - VERSIÓN CORREGIDA

import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html', // Corregido a .component.html por convención
  styleUrls: ['./login.css']    // Corregido a .component.css por convención
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.token) {
          // Lógica de redirección restaurada
          if (response.rol === 'admin') {
            this.router.navigate(['/pos']); // Admins van al POS
          } else if (response.rol === 'cliente') {
            this.router.navigate(['/menu']); // Clientes van al Menú
          } else {
            this.errorMessage = 'Rol de usuario no reconocido.';
            this.authService.logout();
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas. Por favor, inténtelo de nuevo.';
        console.error('Error en el login:', err);
      }
    });
  }
}