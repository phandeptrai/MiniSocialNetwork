import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth';
import { filter, take, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // 🚫 SSR: cho qua, KHÔNG login
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // ✅ Đã login
  if (authService.isAuthenticated()) {
    return true;
  }

  // 🌐 Browser + chưa login → redirect Keycloak
  authService.login();
  return false;
};
