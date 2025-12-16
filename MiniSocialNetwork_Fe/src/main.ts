import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app/app.routes';
import { App } from './app/app';
import { tokenInterceptor } from './app/core/auth/token-interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './app/core/auth/auth';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor])
    ),
    provideOAuthClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initAuthFlow(),
      deps: [AuthService],
      multi: true
    }
  ]

});
