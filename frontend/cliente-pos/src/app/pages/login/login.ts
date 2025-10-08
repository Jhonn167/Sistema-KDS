// src/app/pages/login/login.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
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
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) { return; }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.token) {
          switch (response.rol) {
            case 'admin':
            case 'empleado':
              this.router.navigate(['/pos']);
              break;
            case 'cocinero':
              this.router.navigate(['/kds']);
              break;
            case 'cliente':
              this.router.navigate(['/menu']);
              break;
            default:
              this.errorMessage = 'Rol de usuario no reconocido.';
              this.authService.logout();
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas. Por favor, inténtelo de nuevo.';
        console.error('Error en el login:', err);
      }
    });
  }
}