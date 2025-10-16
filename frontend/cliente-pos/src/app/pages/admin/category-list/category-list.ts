import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.css']
})
export class CategoryListComponent implements OnInit {
  categories: any[] = [];
  categoryForm: FormGroup;

  constructor(private categoryService: CategoryService, private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(data => this.categories = data);
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;
    this.categoryService.createCategory(this.categoryForm.value).subscribe(() => {
      this.loadCategories();
      this.categoryForm.reset();
    });
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría? Los productos asociados quedarán sin categoría.')) {
      this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }
  }
}
