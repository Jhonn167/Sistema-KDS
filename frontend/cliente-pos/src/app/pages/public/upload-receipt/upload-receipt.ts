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
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result; };
      reader.readAsDataURL(file);
    }
  }

  onUpload(): void {
    console.log('--- Depurando onUpload() ---');
    console.log('1. Valor de selectedFile:', this.selectedFile);
    console.log('2. Valor de orderId:', this.orderId);
    console.log('3. Valor de isLoading:', this.isLoading);

    if (!this.selectedFile || !this.orderId || this.isLoading) {
      console.log('La condición de salida se cumplió. La función se detendrá aquí.');
      if (!this.selectedFile) alert('Por favor, selecciona un archivo primero.');
      return;
    }
    
    console.log('4. Condición de salida superada. Procediendo con la subida...');

    this.isLoading = true;
    this.message = '';
    
    const formData = new FormData();
    formData.append('receipt', this.selectedFile);

    const apiUrl = `${environment.apiUrl}/upload/receipt/${this.orderId}`;
    
    console.log('5. Enviando petición POST a:', apiUrl);

    this.http.post<any>(apiUrl, formData).subscribe({
      next: () => {
        console.log('6. Subida exitosa.');
        this.isLoading = false;
        this.isError = false;
        this.message = '¡Comprobante subido! Tu pedido será procesado pronto. Serás redirigido en 3 segundos.';
        setTimeout(() => this.router.navigate(['/mis-pedidos']), 3000);
      },
      error: (err) => {
        console.error('7. ERROR en la subida:', err);
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Error al subir el comprobante.';
      }
    });
  }
}
