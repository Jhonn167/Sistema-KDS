// src/app/pages/pos/pos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category'; // <-- 1. Importa el CategoryService
import { OrderService, CartItem } from '../../services/order';
import { Observable, forkJoin } from 'rxjs';
import { ModifierModalComponent } from '../../components/modifier-modal/modifier-modal';
import { PrintService } from '../../services/print';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, ModifierModalComponent],
  templateUrl: './pos.html',
  styleUrls: ['./pos.css']
})
export class PosComponent implements OnInit {
  allProducts: any[] = [];
  products: any[] = [];
  categories: any[] = [];
  selectedCategoryId: number | null = null;

  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;
  isModalOpen = false;
  selectedProduct: any | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService, // <-- 2. Inyecta el CategoryService
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
      categories: this.categoryService.getCategories() // <-- 3. Llama al servicio correcto
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
    this.loadInitialData();
  }

  filterByCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    if (categoryId === null) {
      this.products = this.allProducts;
    } else {
      this.products = this.allProducts.filter(p => p.categoria_id === categoryId);
    }
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

  // En src/app/pages/pos/pos.component.ts

  onCheckout(): void {
    const itemsToPrint = this.orderService.getCurrentOrderItems();
    const totalToPrint = itemsToPrint.reduce((sum, item) => sum + (item.precioFinal * item.cantidad), 0);

    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Venta registrada exitosamente!');

        const ticketData = {
          businessName: 'Restaurante Mi Casita',
          date: new Date(),
          items: itemsToPrint,
          total: totalToPrint
        };
        // Esta llamada ahora guarda los datos en localStorage, listo para la nueva pestaña
        this.printService.setTicketData(ticketData);
        window.open('/imprimir-ticket', '_blank');

        this.orderService.clearOrder();
        this.loadProducts();
      },
      error: (err) => {
        alert('Error al registrar la venta: ' + (err.error.message || 'Error desconocido'));
        console.error(err);
      }
    });
  }
}
