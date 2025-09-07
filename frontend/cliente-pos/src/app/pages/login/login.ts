// src/app/pages/login/login.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Importamos los módulos necesarios
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Creamos el formulario reactivo
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  // src/app/pages/login/login.component.ts

// ... (imports y otras partes del componente se quedan igual) ...

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // Primero, verificamos que el login fue exitoso y obtuvimos una respuesta
        if (response && response.token) {
          
          // Ahora, decidimos a dónde ir basándonos en el rol
          if (response.rol === 'admin') {
            console.log('Admin ha iniciado sesión. Redirigiendo al POS...');
            this.router.navigate(['/pos']); // Los admins van al POS

          } else if (response.rol === 'cliente') {
            console.log('Cliente ha iniciado sesión. Redirigiendo al menú...');
            this.router.navigate(['/menu']); // Los clientes van al menú

          } else {
            // Caso improbable: rol desconocido
            this.errorMessage = 'Rol de usuario no reconocido.';
            this.authService.logout();
          }

        } else {
            // Caso improbable: respuesta exitosa pero sin token
             this.errorMessage = 'Error de autenticación. Intente de nuevo.';
             this.authService.logout();
        }
      },
      error: (err) => {
        this.errorMessage = 'Credenciales inválidas. Por favor, inténtelo de nuevo.';
        console.error('Error en el login:', err);
      }
    });
  }
}