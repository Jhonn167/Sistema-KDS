// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { provideAnimations } from '@angular/platform-browser/animations'; // <-- 1. Importa esto
import { NgxChartsModule } from '@swimlane/ngx-charts'; 

// 1. Importa la configuración del Socket
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// 2. Define la configuración de la conexión
const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(), // <-- 3. Añade el proveedor de animaciones
    importProvidersFrom(
      SocketIoModule.forRoot(config),
      NgxChartsModule // <-- 4. Añade el módulo de gráficos
    )
  ]
};
