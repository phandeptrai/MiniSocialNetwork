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
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
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
