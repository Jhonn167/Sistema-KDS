// src/app/pages/admin/product-form/product-form.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product';
import { CategoryService } from '../../../services/category';
import { ModifierService } from '../../../services/modifier';
import { forkJoin } from 'rxjs';

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
  
  categories: any[] = [];
  allModifierGroups: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private modifierService: ModifierService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      categoria_id: [null],
      imagen_url: [null],
      modifierGroups: this.fb.array([]) 
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    
    // Cargamos todas las dependencias necesarias
    const categories$ = this.categoryService.getCategories();
    const modifierGroups$ = this.modifierService.getModifierGroups();

    if (this.productId) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Producto';
      const product$ = this.productService.getProductById(this.productId);

      forkJoin([product$, categories$, modifierGroups$]).subscribe(([product, categories, modifiers]) => {
        this.categories = categories;
        this.allModifierGroups = modifiers;
        this.buildModifierCheckboxes(product.modificadores || []);
        this.productForm.patchValue(product);
        if (product.imagen_url) {
          this.imageUrlPreview = product.imagen_url;
        }
      });
    } else {
      forkJoin([categories$, modifierGroups$]).subscribe(([categories, modifiers]) => {
        this.categories = categories;
        this.allModifierGroups = modifiers;
        this.buildModifierCheckboxes([]);
      });
    }
  }
  
  get modifierGroupsFormArray() {
    return this.productForm.get('modifierGroups') as FormArray;
  }

  private buildModifierCheckboxes(assignedModifiers: any[]) {
    const assignedGroupIds = new Set(assignedModifiers.map(m => m.id_grupo));
    this.allModifierGroups.forEach(group => {
      this.modifierGroupsFormArray.push(new FormControl(assignedGroupIds.has(group.id_grupo)));
    });
  }
  
  private getSelectedModifierGroupIds(): number[] {
    return this.productForm.value.modifierGroups
      .map((checked: boolean, i: number) => checked ? this.allModifierGroups[i].id_grupo : null)
      .filter((value: number | null) => value !== null);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = () => { this.imageUrlPreview = reader.result; };
      reader.readAsDataURL(file);

      this.productService.uploadImage(file).subscribe({
        next: (response) => this.productForm.patchValue({ imagen_url: response.imageUrl }),
        error: (err) => console.error('Error al subir la imagen:', err)
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const productData = this.productForm.value;
    if (productData.categoria_id) {
      productData.categoria_id = parseInt(productData.categoria_id, 10);
    }
    const selectedModifierIds = this.getSelectedModifierGroupIds();

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData).subscribe(() => {
        this.productService.assignModifiersToProduct(this.productId!, selectedModifierIds).subscribe(() => {
          this.router.navigate(['/admin/products']);
        });
      });
    } else {
      this.productService.createProduct(productData).subscribe(response => {
        const newProductId = response.productId;
        this.productService.assignModifiersToProduct(newProductId.toString(), selectedModifierIds).subscribe(() => {
          this.router.navigate(['/admin/products']);
        });
      });
    }
  }
}