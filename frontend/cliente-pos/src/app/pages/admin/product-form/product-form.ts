// src/app/pages/admin/product-form/product-form.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  // ¡Ojo a todos los imports necesarios!
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  pageTitle = 'Crear Producto';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute // Para leer el ID de la URL en modo edición
  ) {
    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]]
      // categoria_id: [null] // Puedes añadirlo si manejas categorías
    });
  }

  ngOnInit(): void {
    // Verificamos si la URL contiene un 'id'. Si es así, estamos en modo edición.
    this.productId = this.route.snapshot.paramMap.get('id');

    console.log('ID del producto al cargar el componente:', this.productId);  
    
    if (this.productId) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Producto';
      // Si estamos editando, buscamos el producto por su ID y rellenamos el formulario
      this.productService.getProductById(this.productId).subscribe(product => {
        this.productForm.patchValue(product);
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched(); // Muestra los errores si el form es inválido
      return;
    }

    const productData = this.productForm.value;

        console.log('ID del producto al momento de guardar:', this.productId); 

    if (this.isEditMode && this.productId) {
      // Si estamos en modo edición, llamamos al método de actualizar
      this.productService.updateProduct(this.productId, productData).subscribe({
        next: () => this.router.navigate(['/admin/products']), // Volvemos a la lista
        error: (err) => console.error('Error al actualizar:', err)
      });
    } else {
      // Si no, llamamos al método de crear
      this.productService.createProduct(productData).subscribe({
        next: () => this.router.navigate(['/admin/products']), // Volvemos a la lista
        error: (err) => console.error('Error al crear:', err)
      });
    }
  }
}