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

  // Nuevas propiedades para manejar el modal
  isModalOpen = false;
  selectedProduct: any | null = null;

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService,
    public orderService: OrderService
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

  // Nueva función para manejar el clic en "Añadir"
  handleAddItem(product: any): void {
    // Primero, obtenemos la versión completa del producto con sus modificadores
    this.productService.getProductById(product.id_producto).subscribe(fullProduct => {
      // Si el producto tiene modificadores, abrimos el modal
      if (fullProduct.modificadores && fullProduct.modificadores.length > 0) {
        this.selectedProduct = fullProduct;
        this.isModalOpen = true;
      } else {
        // Si no tiene, lo añadimos directamente al carrito como antes
        const configuredProduct = {
            ...fullProduct,
            finalPrice: fullProduct.precio,
            selectedOptions: []
        };
        this.orderService.addItem(configuredProduct);
        this.notificationService.add('${configuredProduct.nombre} añadido al carrito', 'success');
      }
    });
  }

  // Función para cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  // Función que se ejecuta cuando el modal confirma la selección
  onConfirmProduct(configuredProduct: any): void {
    this.orderService.addItem(configuredProduct);
    this.closeModal();
    this.notificationService.add('${configuredProduct.nombre} añadido al carrito', 'success');
  }
}