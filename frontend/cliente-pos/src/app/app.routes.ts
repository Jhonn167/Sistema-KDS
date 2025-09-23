import { Routes } from '@angular/router';

// Guards
import { AdminGuard } from './guards/admin-guard';
import { authGuard } from './guards/auth-guard';

// Componentes Públicos
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/public/register/register';
import { MenuComponent } from './pages/public/menu/menu';
import { CartComponent } from './pages/public/cart/cart';
import { MyOrdersComponent } from './pages/public/my-orders/my-orders';
import { About } from './pages/public/about/about';
import { GalleryComponent } from './pages/public/gallery/gallery';
import { Contact } from './pages/public/contact/contact';
import { OrderSuccessComponent } from './pages/public/order-success/order-success';

// Componentes de Admin/Staff y Reutilizables
import { ProductListComponent } from './pages/admin/product-list/product-list';
import { ProductFormComponent } from './pages/admin/product-form/product-form';
import { PosComponent } from './pages/pos/pos';
import { KdsComponent } from './pages/kds/kds';
import { ModifierListComponent } from './pages/admin/modifier-list/modifier-list';
import { ReportsComponent } from './pages/admin/reports/reports';
import { ReceiptTicketComponent } from './components/receipt-ticket/receipt-ticket';
import { ForgotPasswordComponent } from './pages/public/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/public/reset-password/reset-password';
import { PaymentConfirmationsComponent } from './pages/admin/payment-confirmations/payment-confirmations';
import { UploadReceiptComponent } from './pages/public/upload-receipt/upload-receipt';

export const routes: Routes = [
  // Redirección principal al menú
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  
  // --- RUTAS PÚBLICAS (Sin Guard) ---
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'carrito', component: CartComponent },
  { path: 'nosotros', component: About },
  { path: 'galeria', component: GalleryComponent },
  { path: 'contacto', component: Contact },
  { path: 'orden-exitosa', component: OrderSuccessComponent },
  { path: 'recuperar-contrasena', component: ForgotPasswordComponent },
  { path: 'restablecer-contrasena/:token', component: ResetPasswordComponent }, // Ruta clave
  

  // --- RUTAS PROTEGIDAS (Requieren Login) ---
  { path: 'mis-pedidos', component: MyOrdersComponent, canActivate: [authGuard] },
  { path: 'subir-comprobante/:orderId', component: UploadReceiptComponent, canActivate: [authGuard] },
  
  // --- RUTAS DE ADMIN (Requieren Rol de Admin) ---
  { path: 'pos', component: PosComponent, canActivate: [AdminGuard] },
  { path: 'kds', component: KdsComponent, canActivate: [AdminGuard] },
  { path: 'imprimir-ticket', component: ReceiptTicketComponent, canActivate: [AdminGuard] },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/edit/:id', component: ProductFormComponent },
      { path: 'modifiers', component: ModifierListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'confirmations', component: PaymentConfirmationsComponent },
      { path: '', redirectTo: 'products', pathMatch: 'full' }
    ]
  },
  
  // La ruta comodín siempre al final
  { path: '**', redirectTo: '/menu' }
];
