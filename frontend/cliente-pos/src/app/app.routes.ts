
import { Routes } from '@angular/router';

// --- Importaciones Corregidas ---
// Las rutas deben ser relativas a la carpeta 'app' (./) y terminar con su tipo (.component, .guard)
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/public/register/register';
import { MenuComponent } from './pages/public/menu/menu';
import { CartComponent } from './pages/public/cart/cart';
import { MyOrdersComponent } from './pages/public/my-orders/my-orders';

import { ProductListComponent } from './pages/admin/product-list/product-list';
import { ProductFormComponent } from './pages/admin/product-form/product-form';
import { ModifierListComponent, } from './pages/admin/modifier-list/modifier-list'; // <-- Se importa el COMPONENTE
import { PosComponent } from './pages/pos/pos';
import { Kds } from './pages/kds/kds';
import { AdminGuard } from './guards/admin-guard';
import { authGuard } from './guards/auth-guard';  
import { ReportsComponent } from './pages/admin/reports/reports';
import { OrderSuccessComponent } from './pages/public/order-success/order-';

export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  
  // --- RUTAS PÚBLICAS ---
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'carrito', component: CartComponent },

  // --- RUTAS PROTEGIDAS ---
  { path: 'mis-pedidos', component: MyOrdersComponent, canActivate: [authGuard] },
  { path: 'pos', component: PosComponent, canActivate: [AdminGuard] },
  { path: 'kds', component: Kds, canActivate: [AdminGuard] },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/edit/:id', component: ProductFormComponent },
      // --- CORRECCIÓN CLAVE ---
      // La ruta ahora usa el ModifierListComponent, que es el componente de la página.
      { path: 'modifiers', component: ModifierListComponent }, 
       { path: 'reports', component: ReportsComponent },
      { path: '', redirectTo: 'products', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: '/menu' }
];
