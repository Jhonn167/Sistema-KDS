// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxStripeModule } from 'ngx-stripe';
import { environment } from '../environments/environments';

// Define la configuración de la conexión para WebSockets
const config: SocketIoConfig = { url: environment.apiUrl, options: {} };

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(
      SocketIoModule.forRoot(config),
      NgxChartsModule,
      // Reemplaza esta clave con tu clave PUBLICABLE de Stripe
      NgxStripeModule.forRoot('pk_test_51S5YwPHFYNdvynTwSkohK0o9FmnZ2L8Xfj3Xza4jeXNNXQ5FSYJl44hklm1AoWzw3AGLq3SNMt5F55rpSgTzkhw5002hf8BXFY')
    )
  ]
};
