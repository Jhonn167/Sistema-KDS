// src/app/pages/pos/pos.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importa FormsModule para el input de búsqueda
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { OrderService, CartItem } from '../../services/order';
import { Observable, forkJoin } from 'rxjs';
import { ModifierModalComponent } from '../../components/modifier-modal/modifier-modal';
import { PrintService } from '../../services/print';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, ModifierModalComponent, FormsModule], // Añade FormsModule
  templateUrl: './pos.html',
  styleUrls: ['./pos.css']
})
export class PosComponent implements OnInit {
  allProducts: any[] = [];
  products: any[] = [];
  categories: any[] = [];
  selectedCategoryId: number | null = null;
  
  searchTerm: string = ''; // Nueva propiedad para la barra de búsqueda

  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;
  isModalOpen = false;
  selectedProduct: any | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    public orderService: OrderService,
    private printService: PrintService
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories()
    }).subscribe(({ products, categories }) => {
      this.allProducts = products;
      this.products = products;
      this.categories = categories;
      this.selectedCategoryId = null;
    });
  }
  loadProducts(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
    });
  }
 refreshProducts(): void {
    this.loadProducts();
  }
  // Nueva función para filtrar por búsqueda Y categoría
  applyFilters(): void {
    let filtered = this.allProducts;

    // 1. Filtrar por categoría (si hay una seleccionada)
    if (this.selectedCategoryId !== null) {
      filtered = filtered.filter(p => p.categoria_id === this.selectedCategoryId);
    }

    // 2. Filtrar por término de búsqueda (si hay algo escrito)
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(lowerCaseSearch));
    }

    this.products = filtered;
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }
  
  // onKeyUp se llama cada vez que el usuario escribe en la barra de búsqueda
  onSearchKeyUp(): void {
    this.applyFilters();
  }

  handleAddItem(product: any): void {
    this.productService.getProductById(product.id_producto.toString()).subscribe(fullProduct => {
      if (fullProduct.modificadores && fullProduct.modificadores.length > 0) {
        this.selectedProduct = fullProduct;
        this.isModalOpen = true;
      } else {
        const configuredProduct = {
            ...fullProduct,
            finalPrice: fullProduct.precio,
            selectedOptions: []
        };
        this.orderService.addItem(configuredProduct);
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  onConfirmProduct(configuredProduct: any): void {
    this.orderService.addItem(configuredProduct);
    this.closeModal();
  }

  onCheckout(): void {
    const itemsToPrint = this.orderService.getCurrentOrderItems();
    const totalToPrint = itemsToPrint.reduce((sum, item) => sum + (item.precioFinal * item.cantidad), 0);

    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Venta registrada exitosamente!');
        const ticketData = {
          businessName: 'Mi Restaurante KDS',
          date: new Date(),
          items: itemsToPrint,
          total: totalToPrint
        };
        this.printService.setTicketData(ticketData);
        window.open('/imprimir-ticket', '_blank');
        this.orderService.clearOrder();
        this.loadInitialData(); // Usamos loadInitialData para recargar todo
      },
      error: (err) => {
        alert('Error al registrar la venta: ' + (err.error.message || 'Error desconocido'));
        console.error(err);
      }
    });
  }
}