// src/app/pages/pos/pos.component.ts - VERSIÓN FINAL CON MODAL

import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { OrderService, CartItem } from '../../services/order';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ModifierModalComponent } from '../../components/modifier-modal/modifier-modal';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, ModifierModalComponent],
  templateUrl: './pos.html',
  styleUrls: ['./pos.css']
})
export class PosComponent implements OnInit {
  products: any[] = [];
  orderItems$: Observable<CartItem[]>;
  orderTotal$: Observable<number>;

  // --- NUEVAS PROPIEDADES PARA MANEJAR EL MODAL ---
  isModalOpen = false;
  selectedProduct: any | null = null;

  constructor(
    private productService: ProductService,
    public orderService: OrderService
  ) {
    this.orderItems$ = this.orderService.orderItems$;
    this.orderTotal$ = this.orderService.orderTotal$;
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
    });
  }

  // --- LÓGICA DE AÑADIR ITEM ACTUALIZADA (IGUAL QUE EN EL MENÚ) ---
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

  // --- NUEVAS FUNCIONES PARA CONTROLAR EL MODAL ---
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  onConfirmProduct(configuredProduct: any): void {
    this.orderService.addItem(configuredProduct);
    this.closeModal();
  }

  onCheckout(): void {
    this.orderService.checkout().subscribe({
      next: (response) => {
        alert('¡Venta registrada exitosamente!');
        this.orderService.clearOrder();
        this.productService.getProducts().subscribe(data => {
          this.products = data;
        });
      },
      error: (err) => {
        alert('Error al registrar la venta: ' + (err.error.message || 'Error desconocido'));
        console.error(err);
      }
    });
  }
}