import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth';
import { isPlatformBrowser } from '@angular/common';

/**
 * Functional Interceptor để tự động đính kèm Bearer Token vào các request API.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const authService = inject(AuthService);

  if (req.url.startsWith('/api') && authService.isAuthenticated()) {
    return next(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${authService.getAccessToken()}`
        }
      })
    );
  }

  return next(req);
};
