import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationStateService } from '../services/notification-state.service';
import { Notification } from '../models/notification.model';

/**
 * Component hiển thị danh sách tất cả notifications.
 */
@Component({
    selector: 'app-notifications-page',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notifications-container">
      <div class="notifications-header">
        <h1>Thông báo</h1>
        <button class="mark-all-btn" (click)="markAllAsRead()" *ngIf="hasUnread">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Đang tải...</span>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!isLoading && notifications.length === 0">
        <div class="empty-icon">🔔</div>
        <h3>Chưa có thông báo</h3>
        <p>Bạn sẽ nhận thông báo khi có người gửi tin nhắn cho bạn.</p>
      </div>

      <!-- Notifications list -->
      <div class="notifications-list" *ngIf="!isLoading && notifications.length > 0">
        <div 
          class="notification-item"
          *ngFor="let notification of notifications"
          [class.unread]="!notification.isRead"
          (click)="handleNotificationClick(notification)">
          
          <div class="notification-avatar">
            <img [src]="notification.senderAvatarUrl" [alt]="notification.senderName" />
            <div class="notification-type-icon" [ngClass]="notification.type.toLowerCase()">
              {{ getTypeIcon(notification.type) }}
            </div>
          </div>
          
          <div class="notification-content">
            <div class="notification-text">
              <span class="sender-name">{{ notification.senderName }}</span>
              <span class="action-text">{{ getActionText(notification.type) }}</span>
            </div>
            <div class="notification-message" *ngIf="notification.message">
              {{ truncateMessage(notification.message) }}
            </div>
            <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
          </div>
          
          <div class="unread-indicator" *ngIf="!notification.isRead"></div>
        </div>

        <!-- Load more button -->
        <button class="load-more-btn" *ngIf="hasMore && !isLoadingMore" (click)="loadMore()">
          Xem thêm
        </button>
        <div class="loading-more" *ngIf="isLoadingMore">
          <div class="spinner small"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .notifications-container {
      max-width: 700px;
      width: 100%;
      margin: 0 auto;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .notifications-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #14171a;
      margin: 0;
    }

    .mark-all-btn {
      padding: 10px 20px;
      background: #1da1f2;
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mark-all-btn:hover {
      background: #1991da;
      transform: translateY(-1px);
    }

    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #657786;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e8ecf0;
      border-top: 3px solid #1da1f2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner.small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 20px;
      color: #14171a;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      margin: 0;
      color: #657786;
    }

    .notifications-list {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f0f2f5;
      position: relative;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background: #f5f8fa;
    }

    .notification-item.unread {
      background: #e8f5fe;
    }

    .notification-item.unread:hover {
      background: #d4edfc;
    }

    .notification-avatar {
      position: relative;
      width: 52px;
      height: 52px;
      flex-shrink: 0;
    }

    .notification-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .notification-type-icon {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border: 2px solid white;
    }

    .notification-type-icon.message {
      background: #1da1f2;
    }

    .notification-type-icon.like {
      background: #e0245e;
    }

    .notification-type-icon.comment {
      background: #17bf63;
    }

    .notification-type-icon.follow {
      background: #794bc4;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-text {
      margin-bottom: 4px;
    }

    .sender-name {
      font-weight: 700;
      color: #14171a;
    }

    .action-text {
      color: #657786;
      margin-left: 4px;
    }

    .notification-message {
      color: #14171a;
      font-size: 14px;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notification-time {
      color: #657786;
      font-size: 13px;
    }

    .unread-indicator {
      width: 10px;
      height: 10px;
      background: #1da1f2;
      border-radius: 50%;
      flex-shrink: 0;
      align-self: center;
    }

    .load-more-btn {
      width: 100%;
      padding: 16px;
      background: transparent;
      border: none;
      color: #1da1f2;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .load-more-btn:hover {
      background: #f5f8fa;
    }

    .loading-more {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
  `]
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
    private notificationApi = inject(NotificationApiService);
    private notificationState = inject(NotificationStateService);
    private router = inject(Router);

    notifications: Notification[] = [];
    isLoading = false;
    isLoadingMore = false;
    hasMore = true;
    hasUnread = false;
    private currentPage = 0;
    private subscription?: Subscription;

    ngOnInit(): void {
        this.loadNotifications();

        // Subscribe để cập nhật khi có notification mới
        this.subscription = this.notificationState.getNotifications().subscribe(notifications => {
            this.notifications = notifications;
            this.hasUnread = notifications.some(n => !n.isRead);
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    loadNotifications(): void {
        this.isLoading = true;
        this.notificationApi.getNotifications(0, 20).subscribe({
            next: (page) => {
                this.notificationState.setNotifications(page.content);
                this.hasMore = !page.last;
                this.currentPage = page.number;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load notifications:', err);
                this.isLoading = false;
            }
        });
    }

    loadMore(): void {
        if (this.isLoadingMore || !this.hasMore) return;

        this.isLoadingMore = true;
        this.notificationApi.getNotifications(this.currentPage + 1, 20).subscribe({
            next: (page) => {
                this.notificationState.addOlderNotifications(page.content);
                this.hasMore = !page.last;
                this.currentPage = page.number;
                this.isLoadingMore = false;
            },
            error: (err) => {
                console.error('Failed to load more notifications:', err);
                this.isLoadingMore = false;
            }
        });
    }

    handleNotificationClick(notification: Notification): void {
        // Đánh dấu đã đọc
        if (!notification.isRead) {
            this.notificationApi.markAsRead(notification.id).subscribe();
            this.notificationState.markAsRead(notification.id);
        }

        // Navigate dựa theo type
        if (notification.type === 'MESSAGE' && notification.conversationId) {
            this.router.navigate(['/chat'], {
                queryParams: { conversationId: notification.conversationId }
            });
        }
    }

    markAllAsRead(): void {
        this.notificationApi.markAllAsRead().subscribe({
            next: () => {
                this.notificationState.markAllAsRead();
            }
        });
    }

    getTypeIcon(type: string): string {
        switch (type) {
            case 'MESSAGE': return '💬';
            case 'LIKE': return '❤️';
            case 'COMMENT': return '💬';
            case 'FOLLOW': return '👤';
            default: return '🔔';
        }
    }

    getActionText(type: string): string {
        switch (type) {
            case 'MESSAGE': return 'đã gửi tin nhắn cho bạn';
            case 'LIKE': return 'đã thích bài viết của bạn';
            case 'COMMENT': return 'đã bình luận bài viết của bạn';
            case 'FOLLOW': return 'đã theo dõi bạn';
            default: return '';
        }
    }

    truncateMessage(message: string): string {
        if (!message) return '';
        return message.length > 80 ? message.substring(0, 77) + '...' : message;
    }

    formatTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    }
}
