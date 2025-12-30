import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeycloakApiService } from '../../services/keycloak-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
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
    // Nếu đã đăng nhập rồi thì redirect về /feed
    if (this.keycloakApi.isAuthenticated()) {
      this.router.navigate(['/feed']);
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
        this.router.navigate(['/feed']);
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
