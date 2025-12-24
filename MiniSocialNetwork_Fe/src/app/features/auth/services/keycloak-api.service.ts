import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface UserInfo {
  sub: string;
  preferred_username: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class KeycloakApiService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  // Keycloak configuration - sử dụng proxy để tránh CORS
  private readonly keycloakUrl = '/keycloak';
  private readonly realm = 'social-network';
  private readonly clientId = 'social-network-client';

  private get tokenEndpoint(): string {
    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  private get userInfoEndpoint(): string {
    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
  }

  private get registerEndpoint(): string {
    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/registrations`;
  }

  /**
   * Đăng nhập với username và password
   * Sử dụng Resource Owner Password Credentials Grant (Direct Access Grants)
   */
  login(username: string, password: string): Observable<TokenResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', this.clientId)
      .set('username', username)
      .set('password', password)
      .set('scope', 'openid profile email');

    return this.http.post<TokenResponse>(this.tokenEndpoint, body.toString(), { headers }).pipe(
      map(response => {
        this.saveTokens(response);
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Đăng ký tài khoản mới thông qua Backend API
   * Backend sẽ gọi Keycloak Admin API để tạo user
   */
  register(username: string, email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return this.http.post('/api/auth/register', {
      username,
      email,
      password,
      firstName,
      lastName
    });
  }

  /**
   * Đăng ký user thông qua Backend API (an toàn hơn)
   * Backend sẽ sử dụng service account để gọi Keycloak Admin API
   */
  registerViaBackend(username: string, email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return this.http.post('/api/auth/register', {
      username,
      email,
      password,
      firstName,
      lastName
    }).pipe(
      switchMap(() => this.login(username, password))
    );
  }

  /**
   * Làm mới access token bằng refresh token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', this.clientId)
      .set('refresh_token', refreshToken);

    return this.http.post<TokenResponse>(this.tokenEndpoint, body.toString(), { headers }).pipe(
      map(response => {
        this.saveTokens(response);
        return response;
      })
    );
  }

  /**
   * Đăng xuất - xóa tokens khỏi storage
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
    }
  }

  /**
   * Lấy thông tin user từ access token
   */
  getUserInfo(): Observable<UserInfo> {
    const token = this.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UserInfo>(this.userInfoEndpoint, { headers });
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   * Nếu token hết hạn sẽ tự động xóa
   */
  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = this.getAccessToken();
    const expiry = localStorage.getItem('token_expiry');

    if (!token || !expiry) {
      return false;
    }

    // Kiểm tra token có hết hạn không
    const isExpired = Date.now() >= parseInt(expiry, 10);

    if (isExpired) {
      // Xóa token hết hạn
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Lấy access token
   */
  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('access_token');
  }

  /**
   * Lấy refresh token
   */
  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('refresh_token');
  }

  /**
   * Lưu tokens vào localStorage
   */
  private saveTokens(response: TokenResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);

    // Lưu thời gian hết hạn (trừ đi 30 giây để refresh sớm)
    const expiryTime = Date.now() + (response.expires_in - 30) * 1000;
    localStorage.setItem('token_expiry', expiryTime.toString());
  }

  /**
   * Parse JWT token để lấy claims
   */
  parseToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
