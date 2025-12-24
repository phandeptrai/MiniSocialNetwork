import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeycloakApiService } from '../../services/keycloak-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="logo-section">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1>Mini Social Network</h1>
          <p>Đăng nhập để tiếp tục</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Tên đăng nhập hoặc Email</label>
            <input 
              type="text" 
              id="username" 
              name="username"
              [(ngModel)]="username"
              placeholder="Nhập tên đăng nhập"
              required
              [disabled]="isLoading()"
            >
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              [(ngModel)]="password"
              placeholder="Nhập mật khẩu"
              required
              [disabled]="isLoading()"
            >
          </div>

          <div class="remember-forgot">
            <label class="remember-me">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" class="forgot-password">Quên mật khẩu?</a>
          </div>

          <button type="submit" class="submit-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Đang đăng nhập...
            } @else {
              Đăng nhập
            }
          </button>
        </form>

        <div class="divider"><span>Chưa có tài khoản?</span></div>
        
        <div class="register-link">
          <a routerLink="/register">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .login-wrapper {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
      padding: 48px;
      width: 100%;
      max-width: 440px;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      color: white;
    }

    .logo svg {
      width: 40px;
      height: 40px;
    }

    .logo-section h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .logo-section p {
      color: #6b7280;
      font-size: 15px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .form-group input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }

    .form-group input::placeholder {
      color: #9ca3af;
    }

    .form-group input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .remember-forgot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .remember-me input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #667eea;
      cursor: pointer;
    }

    .remember-me span {
      color: #4b5563;
    }

    .forgot-password {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }

    .forgot-password:hover {
      color: #764ba2;
    }

    .submit-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 28px 0;
      color: #9ca3af;
      font-size: 13px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      padding: 0 16px;
    }

    .register-link {
      text-align: center;
      color: #6b7280;
      font-size: 15px;
    }

    .register-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .register-link a:hover {
      color: #764ba2;
    }

    .alert {
      padding: 14px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 32px 24px;
      }

      .logo-section h1 {
        font-size: 24px;
      }
    }
  `]
})
export class LoginPage {
  private keycloakApi = inject(KeycloakApiService);
  private router = inject(Router);

  username = '';
  password = '';
  rememberMe = false;

  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    // Nếu đã đăng nhập rồi thì redirect về /chat
    if (this.keycloakApi.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage.set('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.keycloakApi.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (error: any) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Tên đăng nhập hoặc mật khẩu không đúng');
        } else if (error.status === 400) {
          this.errorMessage.set('Thông tin đăng nhập không hợp lệ');
        } else {
          this.errorMessage.set('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
      }
    });
  }
}

