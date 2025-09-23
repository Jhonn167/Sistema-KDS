// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // <-- 1. Importa esto
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { NgxChartsModule } from '@swimlane/ngx-charts'; 
import { StripeService } from 'ngx-stripe';



// 2. Define la configuración de la conexión
const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(), // <-- 3. Añade el proveedor de animaciones
    importProvidersFrom(
      SocketIoModule.forRoot(config),
      NgxChartsModule,// <-- 4. Añade el módulo de gráficos
     NgxStripeModule.forRoot('pk_test_51S5YwPHFYNdvynTwSkohK0o9FmnZ2L8Xfj3Xza4jeXNNXQ5FSYJl44hklm1AoWzw3AGLq3SNMt5F55rpSgTzkhw5002hf8BXFY')
    )
  ]
};
