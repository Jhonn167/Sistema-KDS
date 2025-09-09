// src/app/pages/admin/product-form/product-form.component.ts - VERSIÓN FINAL

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  pageTitle = 'Crear Producto';
  imageUrlPreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Definimos el formulario incluyendo el campo para la URL de la imagen
    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      categoria_id: [null],
      imagen_url: [null] // <-- ESTA ES LA LÍNEA CLAVE QUE FALTABA
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    
    if (this.productId) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Producto';
      this.productService.getProductById(this.productId).subscribe(product => {
        this.productForm.patchValue(product);
        if (product.imagen_url) {
          this.imageUrlPreview = product.imagen_url;
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      
      const reader = new FileReader();
      reader.onload = () => { this.imageUrlPreview = reader.result; };
      reader.readAsDataURL(file);

      this.productService.uploadImage(file).subscribe({
        next: (response) => {
          console.log('Imagen subida con éxito. URL:', response.imageUrl);
          this.productForm.patchValue({ imagen_url: response.imageUrl });
        },
        error: (err) => {
          console.error('Error al subir la imagen:', err);
          alert('Hubo un error al subir la imagen.');
        }
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productData = this.productForm.value;
    console.log('Enviando datos del producto:', productData);

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData).subscribe({
        next: () => this.router.navigate(['/admin/products']),
        error: (err) => console.error('Error al actualizar:', err)
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: () => this.router.navigate(['/admin/products']),
        error: (err) => console.error('Error al crear:', err)
      });
    }
  }
}