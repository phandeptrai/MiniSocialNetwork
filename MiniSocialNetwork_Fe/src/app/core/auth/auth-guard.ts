import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { KeycloakApiService } from '../../features/auth/services/keycloak-api.service';

export const authGuard: CanActivateFn = (route, state) => {
  const keycloakApi = inject(KeycloakApiService);
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // 🚫 SSR: cho qua, KHÔNG login
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // ✅ Đã login
  if (keycloakApi.isAuthenticated()) {
    return true;
  }

  // 🌐 Browser + chưa login → redirect /login
  router.navigate(['/login']);
  return false;
};
