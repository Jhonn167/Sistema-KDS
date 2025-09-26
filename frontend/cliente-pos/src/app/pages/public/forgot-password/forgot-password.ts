// src/app/pages/public/forgot-password/forgot-password.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.message = '';

    // --- CORRECCIÓN CLAVE: Añadimos /api/ a la URL ---
    const apiUrl = `${environment.apiUrl}/api/auth/forgot-password`;
    
    this.http.post<any>(apiUrl, this.forgotForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isError = false;
        this.message = response.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error.message || 'Ocurrió un error en el servidor.';
      }
    });
  }
}
