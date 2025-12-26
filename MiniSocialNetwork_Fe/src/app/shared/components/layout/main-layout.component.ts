import { Component, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { KeycloakApiService } from '../../../features/auth/services/keycloak-api.service';
import { NotificationSocketService } from '../../../features/notifications/services/notification-socket.service';
import { NotificationStateService } from '../../../features/notifications/services/notification-state.service';
import { NotificationToastComponent } from '../notification-toast/notification-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationToastComponent],
  template: `
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">MiniSocial</h1>
        </div>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="avatar">
            <img src="https://ui-avatars.com/api/?name=User&background=667eea&color=fff" alt="avatar" />
          </div>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-handle">&#64;{{ userHandle }}</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav-menu">
          <a routerLink="/feed" routerLinkActive="active" class="nav-item" (click)="onNavClick('/feed')">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Feed</span>
          </a>
          <a routerLink="/people" routerLinkActive="active" class="nav-item" (click)="onNavClick('/people')">
            <span class="nav-icon">👥</span>
            <span class="nav-text">People</span>
          </a>
          <a routerLink="/chat" routerLinkActive="active" class="nav-item" (click)="onNavClick('/chat')">
            <span class="nav-icon">💬</span>
            <span class="nav-text">Messages</span>
          </a>
          <a routerLink="/notifications" routerLinkActive="active" class="nav-item notification-nav" (click)="onNotificationsClick()">
            <span class="nav-icon-wrapper">
              <span class="nav-icon">🔔</span>
              <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </span>
            <span class="nav-text">Notifications</span>
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="onNavClick('/profile')">
            <span class="nav-icon">👤</span>
            <span class="nav-text">My Profile</span>
          </a>
        </nav>

        <!-- Sign Out -->
        <div class="sidebar-footer">
          <button class="sign-out-btn" (click)="signOut()">
            <span class="nav-icon">🚪</span>
            <span class="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content" #mainContent>
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Notification Toast -->
    <app-notification-toast></app-notification-toast>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background: #f5f7fa;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid #e8ecf0;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
    }

    .sidebar-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f2f5;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #1da1f2;
      margin: 0;
    }

    /* User Profile */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid #f0f2f5;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      color: #14171a;
      font-size: 15px;
    }

    .user-handle {
      color: #657786;
      font-size: 13px;
    }

    /* Navigation */
    .nav-menu {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      color: #14171a;
      text-decoration: none;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-item:hover {
      background: #e8f5fe;
      color: #1da1f2;
    }

    .nav-item.active {
      background: #e8f5fe;
      color: #1da1f2;
    }

    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    /* Notification Badge */
    .nav-icon-wrapper {
      position: relative;
      display: inline-flex;
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -10px;
      background: #e0245e;
      color: white;
      font-size: 11px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 2px solid #ffffff;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid #f0f2f5;
    }

    .sign-out-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      width: 100%;
      border: none;
      background: transparent;
      color: #e0245e;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sign-out-btn:hover {
      background: #fce4ec;
    }

    /* Main Content */
    .main-content {
      margin-left: 260px;
      min-height: 100vh;
      padding: 24px 32px;
      width: calc(100% - 260px);
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: scroll;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    /* Custom Scrollbar */
    .main-content::-webkit-scrollbar {
      width: 8px;
    }

    .main-content::-webkit-scrollbar-track {
      background: #f0f2f5;
      border-radius: 4px;
    }

    .main-content::-webkit-scrollbar-thumb {
      background: #c1c7cd;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .main-content::-webkit-scrollbar-thumb:hover {
      background: #a0a8b0;
    }

    .main-content ::ng-deep .feed-container,
    .main-content ::ng-deep > * {
      width: 100%;
      max-width: 900px;
    }

    /* Chat takes full width and height - no scroll */
    .main-content ::ng-deep .chat-container,
    .main-content ::ng-deep app-chat-page {
      max-width: 100%;
      height: calc(100vh - 48px);
      overflow: hidden;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 70px;
      }

      .sidebar-header,
      .user-profile .user-info,
      .nav-text {
        display: none;
      }

      .user-profile {
        justify-content: center;
        padding: 16px;
      }

      .nav-item {
        justify-content: center;
        padding: 14px;
      }

      .nav-icon {
        margin: 0;
      }

      .main-content {
        margin-left: 70px;
        width: calc(100% - 70px);
        padding: 16px;
      }

      .sign-out-btn {
        justify-content: center;
      }

      .sign-out-btn .nav-text {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private keycloakApi = inject(KeycloakApiService);
  private router = inject(Router);
  private notificationSocket = inject(NotificationSocketService);
  private notificationState = inject(NotificationStateService);

  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;

  userName = 'John Doe';
  userHandle = 'johndoe';
  unreadCount = 0;

  private unreadSub?: Subscription;

  ngOnInit(): void {
    // Lấy thông tin user từ token
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        this.userName = claims.name || claims.preferred_username || 'User';
        this.userHandle = claims.preferred_username || 'user';
      }
    }

    // Kết nối WebSocket cho notifications
    this.notificationSocket.connect();

    // Subscribe vào unread count
    this.unreadSub = this.notificationState.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
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
