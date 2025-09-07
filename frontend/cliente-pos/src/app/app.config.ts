// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter, withDebugTracing} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Importa withInterceptors
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor'; // Importa tu interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes , withDebugTracing()),
    // Esta línea provee el HttpClient Y le dice que use tu interceptor
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};