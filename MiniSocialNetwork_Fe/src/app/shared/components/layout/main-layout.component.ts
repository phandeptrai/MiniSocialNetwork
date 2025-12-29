import { Component, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { KeycloakApiService } from '../../../features/auth/services/keycloak-api.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationSocketService } from '../../../features/notifications/services/notification-socket.service';
import { NotificationStateService } from '../../../features/notifications/services/notification-state.service';
import { NotificationToastComponent } from '../notification-toast/notification-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private keycloakApi = inject(KeycloakApiService);
  private userService = inject(UserService);
  private router = inject(Router);
  private notificationSocket = inject(NotificationSocketService);
  private notificationState = inject(NotificationStateService);

  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;

  userName = '';
  userHandle = '';
  userAvatarUrl = '';
  unreadCount = 0;

  private userId = '';
  private unreadSub?: Subscription;

  ngOnInit(): void {
    // Lấy userId từ token trước
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        this.userId = claims.sub;
        // Set giá trị tạm từ JWT (fallback)
        this.userName = claims.name || claims.preferred_username || '';
        this.userHandle = claims.preferred_username || '';
        this.userAvatarUrl = this.generateDefaultAvatar(this.userName);

        // Gọi API để lấy thông tin đầy đủ từ getUserById
        this.loadUserProfile();
      }
    }

    // Kết nối WebSocket cho notifications
    this.notificationSocket.connect();

    // Subscribe vào unread count
    this.unreadSub = this.notificationState.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
  }

  /**
   * Gọi API /api/users/{id} để lấy thông tin user đầy đủ (từ Keycloak + MySQL)
   */
  private loadUserProfile(): void {
    if (!this.userId) return;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        console.log('📦 User profile loaded from API:', user);
        this.userName = user.name || user.username || '';
        this.userHandle = user.username || '';
        this.userAvatarUrl = user.avatarUrl || this.generateDefaultAvatar(this.userName);
      },
      error: (err) => {
        console.warn('⚠️ Failed to load user profile from API, using JWT data:', err);
        // Giữ nguyên giá trị từ JWT nếu API fail
      }
    });
  }

  /**
   * Generate default avatar URL
   */
  private generateDefaultAvatar(name: string): string {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=667eea&color=fff`;
  }

  ngOnDestroy(): void {
    this.unreadSub?.unsubscribe();
    this.notificationSocket.disconnect();
    this.notificationState.reset();
  }

  onNavClick(route: string): void {
    // Nếu đang ở trang đó rồi, scroll về đầu trang
    if (this.router.url === route) {
      this.scrollToTop();
    }
  }

  onNotificationsClick(): void {
    // Mark all as read khi click vào notifications
    if (this.unreadCount > 0) {
      // Không tự động mark all, để user tự quyết định
    }
    this.onNavClick('/notifications');
  }

  private scrollToTop(): void {
    if (this.mainContent?.nativeElement) {
      this.mainContent.nativeElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  signOut(): void {
    this.notificationSocket.disconnect();
    this.notificationState.reset();
    this.keycloakApi.logout();
    this.router.navigate(['/login']);
  }
}
