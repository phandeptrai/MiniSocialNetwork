import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { KeycloakApiService } from '../../features/auth/services/keycloak-api.service';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

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
      // Nếu lỗi 401 Unauthorized
      // Bỏ qua request /api/users/me (check user exists) và request lấy token (để tránh lặp vô hạn)
      if (error.status === 401 &&
        !req.url.includes('/api/users/me') &&
        !req.url.includes('/protocol/openid-connect/token')) {

        console.log('🔄 Access token expired. Attempting to refresh...');

        return keycloakApi.refreshToken().pipe(
          switchMap((tokenRes) => {
            console.log('✅ Token refreshed successfully.');
            // Clone request cũ với token mới
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${tokenRes.access_token}`
              }
            });
            // Retry request
            return next(newReq);
          }),
          catchError((refreshErr) => {
            console.warn('🔐 Refresh token failed or expired. Redirecting to login...', refreshErr);
            // Nếu refresh fail -> Logout
            keycloakApi.logout();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
