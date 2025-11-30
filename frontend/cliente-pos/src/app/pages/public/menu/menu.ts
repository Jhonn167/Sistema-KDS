import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product';
import { OrderService } from '../../../services/order';
import { Observable } from 'rxjs';
import { ModifierModalComponent } from '../../../components/modifier-modal/modifier-modal';
import { NotificationService } from '../../../services/notification'; 

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, ModifierModalComponent, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  allProducts: any[] = []; // Copia original de todos los productos
  products: any[] = [];    // Productos que se muestran (filtrados)
  isLoading = true;
  cartItemCount$: Observable<number>;
  isModalOpen = false;
  selectedProduct: any | null = null;
  searchTerm: string = ''; // Aquí guardamos lo que escribas

  constructor(
    private productService: ProductService,
    public orderService: OrderService,
    private notificationService: NotificationService
  ) {
    this.cartItemCount$ = this.orderService.totalItemCount$;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  // Función que filtra cuando escribes
  filterProducts(): void {
    if (!this.searchTerm) {
      this.products = this.allProducts; // Si borras, muestra todo
    } else {
      const term = this.searchTerm.toLowerCase();
      this.products = this.allProducts.filter(product =>
        product.nombre.toLowerCase().includes(term)
      );
    }
  }

  handleAddItem(product: any): void {
    this.productService.getProductById(product.id_producto.toString()).subscribe(fullProduct => {
      if (fullProduct.modificadores && fullProduct.modificadores.length > 0) {
        this.selectedProduct = fullProduct;
        this.isModalOpen = true;
      } else {
        const configuredProduct = { ...fullProduct, finalPrice: fullProduct.precio, selectedOptions: [] };
        this.orderService.addItem(configuredProduct);
        this.showAddedNotification(configuredProduct);
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
    this.showAddedNotification(configuredProduct);
  }

  private showAddedNotification(product: any): void {
     this.notificationService.add(`${product.nombre} añadido al carrito`, 'success');
  }
}

