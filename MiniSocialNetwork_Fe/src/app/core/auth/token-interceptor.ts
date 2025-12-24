import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { KeycloakApiService } from '../../features/auth/services/keycloak-api.service';
import { isPlatformBrowser } from '@angular/common';

/**
 * Functional Interceptor để tự động đính kèm Bearer Token vào các request API.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const keycloakApi = inject(KeycloakApiService);

  // Chỉ thêm token cho các request API (không phải Keycloak)
  const isApiRequest = req.url.startsWith('/api') || req.url.includes('localhost:8080');
  const isKeycloakRequest = req.url.includes('localhost:8180');

  if (isApiRequest && !isKeycloakRequest && keycloakApi.isAuthenticated()) {
    const token = keycloakApi.getAccessToken();
    if (token) {
      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      );
    }
  }

  return next(req);
};
