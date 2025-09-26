// src/app/pages/public/upload-receipt/upload-receipt.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';

@Component({
  selector: 'app-upload-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-receipt.html',
  styleUrls: ['./upload-receipt.css']
})
export class UploadReceiptComponent implements OnInit {
  orderId: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
  }

  onFileSelected(event: any): void {
    // ... (esta función se mantiene igual)
  }

  onUpload(): void {
    if (!this.selectedFile || !this.orderId || this.isLoading) { return; }
    this.isLoading = true;
    this.message = '';
    
    const formData = new FormData();
    formData.append('receipt', this.selectedFile);

    // CORRECCIÓN: Añadimos /api/ a la URL
    const apiUrl = `${environment.apiUrl}/api/upload/receipt/${this.orderId}`;
    
    this.http.post<any>(apiUrl, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.isError = false;
        this.message = '¡Comprobante subido! Tu pedido será procesado pronto. Serás redirigido en 3 segundos.';
        setTimeout(() => this.router.navigate(['/mis-pedidos']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Error al subir el comprobante.';
      }
    });
  }
}
