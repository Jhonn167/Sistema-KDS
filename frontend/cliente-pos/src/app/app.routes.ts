
import { Routes } from '@angular/router';
import { ProductListComponent } from '../app/pages/admin/product-list/product-list';
import { LoginComponent } from '../app/pages/login/login';
import { ProductFormComponent } from '../app/pages/admin/product-form/product-form';
import { AdminGuard } from './guards/admin-guard'; // Asegúrate de que la ruta sea correcta
import { PosComponent } from '../app/pages/pos/pos';

// src/app/app.routes.ts
// ... imports
import { RegisterComponent } from './pages/public/register/register';
import { MenuComponent } from './pages/public/menu/menu';
import { CartComponent } from './pages/public/cart/cart';
import { MyOrders } from './pages/public/my-orders/my-orders';



export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' }, // ¡Cambiemos esto para que la página principal sea el menú!
  
  // --- RUTAS PÚBLICAS (Sin Guard) ---
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'carrito', component: CartComponent },

  // --- RUTAS PROTEGIDAS (Con Guard) ---
  { path: 'mis-pedidos', component: MyOrders, canActivate: [AdminGuard] },
  { path: 'pos', component: PosComponent, canActivate: [AdminGuard] },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/edit/:id', component: ProductFormComponent },
      { path: '', redirectTo: 'products', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: '/menu' } // Si no encuentra la ruta, que vaya al menú
];