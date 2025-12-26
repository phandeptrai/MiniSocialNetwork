import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeycloakApiService } from '../../services/keycloak-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-wrapper">
      <div class="register-container">
        <div class="logo-section">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1>Tạo tài khoản</h1>
          <p>Tham gia Mini Social Network</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Họ <span class="required">*</span></label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName"
                [(ngModel)]="firstName"
                placeholder="Nhập họ"
                required
                [disabled]="isLoading()"
              >
            </div>
            <div class="form-group">
              <label for="lastName">Tên <span class="required">*</span></label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName"
                [(ngModel)]="lastName"
                placeholder="Nhập tên"
                required
                [disabled]="isLoading()"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email <span class="required">*</span></label>
            <input 
              type="email" 
              id="email" 
              name="email"
              [(ngModel)]="email"
              placeholder="example&#64;email.com"
              required
              [disabled]="isLoading()"
            >
          </div>

          <div class="form-group">
            <label for="username">Tên đăng nhập <span class="required">*</span></label>
            <input 
              type="text" 
              id="username" 
              name="username"
              [(ngModel)]="username"
              placeholder="Chọn tên đăng nhập"
              required
              [disabled]="isLoading()"
            >
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu <span class="required">*</span></label>
            <input 
              type="password" 
              id="password" 
              name="password"
              [(ngModel)]="password"
              placeholder="Tối thiểu 8 ký tự"
              required
              minlength="8"
              [disabled]="isLoading()"
            >
          </div>

          <div class="form-group">
            <label for="confirmPassword">Xác nhận mật khẩu <span class="required">*</span></label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              required
              [disabled]="isLoading()"
            >
          </div>

          <button type="submit" class="submit-btn" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Đang đăng ký...
            } @else {
              Đăng ký
            }
          </button>

          <a routerLink="/login" class="back-btn">
            ← Quay lại đăng nhập
          </a>
        </form>

        <div class="divider"><span>Đã có tài khoản?</span></div>
        
        <div class="login-link">
          <a routerLink="/login">Đăng nhập ngay</a>
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

    .register-wrapper {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .register-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
      padding: 40px 48px;
      width: 100%;
      max-width: 500px;
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
      margin-bottom: 28px;
    }

    .logo {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      color: white;
    }

    .logo svg {
      width: 36px;
      height: 36px;
    }

    .logo-section h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 6px;
    }

    .logo-section p {
      color: #6b7280;
      font-size: 14px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .form-group label .required {
      color: #ef4444;
    }

    .form-group input {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
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

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      margin-top: 8px;
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
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .back-btn {
      width: 100%;
      padding: 14px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      color: #4b5563;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 12px;
      text-decoration: none;
      display: block;
      text-align: center;
    }

    .back-btn:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 24px 0;
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

    .login-link {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .login-link a:hover {
      color: #764ba2;
    }

    .alert {
      padding: 12px 14px;
      border-radius: 10px;
      margin-bottom: 18px;
      font-size: 13px;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }

    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
    }

    @media (max-width: 520px) {
      .register-container {
        padding: 28px 24px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .logo-section h1 {
        font-size: 22px;
      }
    }
  `]
})
export class RegisterPage {
  private keycloakApi = inject(KeycloakApiService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  onSubmit(): void {
    // Validate form
    if (!this.firstName || !this.lastName || !this.email || !this.username || !this.password || !this.confirmPassword) {
      this.errorMessage.set('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage.set('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Mật khẩu xác nhận không khớp');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Gọi API backend để đăng ký
    this.keycloakApi.register(
      this.username,
      this.email,
      this.password,
      this.firstName,
      this.lastName
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Đăng ký thành công! Đang chuyển hướng...');

        // Chuyển hướng sang trang login sau 2 giây
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.isLoading.set(false);

        // Hiển thị thông báo lỗi cụ thể
        if (error.status === 409) {
          this.errorMessage.set('Tên đăng nhập hoặc email đã tồn tại');
        } else if (error.error?.error) {
          this.errorMessage.set(error.error.error);
        } else {
          this.errorMessage.set('Đăng ký không thành công. Vui lòng thử lại sau.');
        }
      }
    });
  }
}
