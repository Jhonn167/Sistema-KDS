// src/app/pages/public/reset-password/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'] // Usaremos los mismos estilos
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;
  private token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Obtenemos el token de la URL
    this.token = this.route.snapshot.paramMap.get('token');
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.message = '';

    const apiUrl = `${environment.apiUrl}/auth/reset-password/${this.token}`;
    this.http.post<any>(apiUrl, this.resetForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isError = false;
        this.message = response.message + ' Serás redirigido al login.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error.message || 'Ocurrió un error en el servidor.';
      }
    });
  }
}
