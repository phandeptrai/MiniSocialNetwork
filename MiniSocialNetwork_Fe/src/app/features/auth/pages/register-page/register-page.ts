import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeycloakApiService } from '../../services/keycloak-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css'
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
