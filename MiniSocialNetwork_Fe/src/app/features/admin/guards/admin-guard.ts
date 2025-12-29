import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';

/**
 * Guard để bảo vệ các routes admin
 * Chỉ cho phép user có role 'admin' truy cập
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const keycloakApi = inject(KeycloakApiService);
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);

    // 🚫 SSR: cho qua
    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    // ✅ Đã login và là admin
    if (keycloakApi.isAuthenticated() && keycloakApi.isAdmin()) {
        return true;
    }

    // 🌐 Không phải admin → redirect về feed
    console.warn('Access denied: Admin role required');
    router.navigate(['/feed']);
    return false;
};
