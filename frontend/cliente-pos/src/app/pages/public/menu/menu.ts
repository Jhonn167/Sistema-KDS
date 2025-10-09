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
  imports: [CommonModule, RouterModule, ModifierModalComponent],
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
    private notificationService: NotificationService
  ) {
    this.cartItemCount$ = this.orderService.totalItemCount$;
  }

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => { this.products = data; this.isLoading = false; },
      error: (err) => { console.error('Error al cargar el menú:', err); this.isLoading = false; }
    });
  }

  handleAddItem(product: any): void {
    this.productService.getProductById(product.id_producto.toString()).subscribe(fullProduct => {
      if (fullProduct.modificadores && fullProduct.modificadores.length > 0) {
        this.selectedProduct = fullProduct;
        this.isModalOpen = true;
      } else {
        const configuredProduct = { ...fullProduct, finalPrice: fullProduct.precio, selectedOptions: [] };
        this.orderService.addItem(configuredProduct);
        this.showAddedToCartNotification(configuredProduct);
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
    this.showAddedToCartNotification(configuredProduct);
  }

  // --- FUNCIÓN MEJORADA PARA NOTIFICACIONES ---
  private showAddedToCartNotification(product: any): void {
    const cartItems = this.orderService.getCurrentOrderItems();
    const itemInCart = cartItems.find(item => item.producto_id === product.id_producto && JSON.stringify(item.selectedOptions) === JSON.stringify(product.selectedOptions || []));
    const quantity = itemInCart ? itemInCart.cantidad : 0;
    this.notificationService.add(`${quantity}x ${product.nombre} añadido(s) al carrito`, 'success');
  }
}
