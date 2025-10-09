// src/app/pages/public/menu/menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';
import { OrderService } from '../../../services/order';
import { Observable } from 'rxjs';
import { ModifierModalComponent } from '../../../components/modifier-modal/modifier-modal';
import { NotificationService } from '../../../services/notification';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, ModifierModalComponent], // <-- Añade el modal a los imports
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuComponent implements OnInit {
  products: any[] = [];
  isLoading = true;
  cartItemCount$: Observable<number>;
  isModalOpen = false;
  selectedProduct: any | null = null;

  constructor(
    private productService: ProductService,
    public orderService: OrderService,
    private notificationService: NotificationService // 2. Inyéctalo
  ) {
    this.cartItemCount$ = this.orderService.totalItemCount$;
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el menú:', err);
        this.isLoading = false;
      }
    });
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
        // Muestra la notificación para productos simples
        this.notificationService.add(`${configuredProduct.nombre} fue añadido al carrito`, 'success');
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
    // 3. Muestra la notificación para productos con modificadores
    this.notificationService.add(`${configuredProduct.nombre} fue añadido al carrito`, 'success');
  }
}
