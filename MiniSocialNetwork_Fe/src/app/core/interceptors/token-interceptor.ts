import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { KeycloakApiService } from '../../features/auth/services/keycloak-api.service';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Functional Interceptor để tự động đính kèm Bearer Token vào các request API.
 * Khi token hết hạn (401), tự động redirect về trang login.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const keycloakApi = inject(KeycloakApiService);
  const router = inject(Router);

  // Chỉ thêm token cho các request API (không phải Keycloak)
  const isApiRequest = req.url.startsWith('/api') || req.url.includes('localhost:8080');
  const isKeycloakRequest = req.url.includes('localhost:8180') || req.url.includes('/keycloak');

  let clonedReq = req;

  if (isApiRequest && !isKeycloakRequest) {
    const token = keycloakApi.getAccessToken();
    if (token) {
      clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Khi nhận lỗi 401 Unauthorized, redirect về trang login
      if (error.status === 401) {
        console.warn('🔐 Token expired or invalid. Redirecting to login...');
        keycloakApi.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
