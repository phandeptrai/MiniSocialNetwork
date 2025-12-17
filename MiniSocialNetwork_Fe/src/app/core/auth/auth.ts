import { inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';
import { authConfig } from './auth.config';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private platformId = inject(PLATFORM_ID);
  private oauthService!: OAuthService;
  private tokenReadySubject = new BehaviorSubject<boolean>(false);
  tokenReady$ = this.tokenReadySubject.asObservable();


  constructor(private injector: Injector) { }

  private getOAuth(): OAuthService | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    if (!this.oauthService) {
      this.oauthService = this.injector.get(OAuthService);
    }

    return this.oauthService;
  }

  async initAuthFlow(): Promise<void> {
    const oauth = this.getOAuth();
    if (!oauth) return;

    authConfig.redirectUri = window.location.origin + '/chat';

    oauth.configure(authConfig);

    oauth.events
      .pipe(filter(e => e.type === 'token_received'))
      .subscribe(() => this.handleNewToken());

    try {
      await oauth.loadDiscoveryDocumentAndTryLogin();
      oauth.setupAutomaticSilentRefresh();

      if (this.isAuthenticated()) {
        this.handleNewToken();
      }
    } catch (error) {
      console.error('OAuth init error:', error);
    }
  }

  login(): void {
    this.getOAuth()?.initCodeFlow();
  }

  logout(): void {
    this.getOAuth()?.logOut();
  }

  isAuthenticated(): boolean {
    return this.getOAuth()?.hasValidAccessToken() ?? false;
  }

  getAccessToken(): string {
    return this.getOAuth()?.getAccessToken() ?? '';
  }

  getIdentityClaims(): any {
    return this.getOAuth()?.getIdentityClaims();
  }

  private handleNewToken(): void {
    const claims = this.getIdentityClaims();
    if (!claims) return;

    console.log('Current user:', {
      id: claims.sub,
      name: claims.name || claims.preferred_username,
      avatarUrl: claims.picture
    });

    // 🔥 BÁO HIỆU TOKEN SẴN SÀNG
    this.tokenReadySubject.next(true);
  }

}
