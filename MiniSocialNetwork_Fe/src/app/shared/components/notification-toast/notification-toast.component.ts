import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NotificationStateService } from '../../../features/notifications/services/notification-state.service';
import { Notification } from '../../../features/notifications/models/notification.model';

/**
 * Component hiển thị toast notification khi nhận notification mới.
 * Auto dismiss sau 5 giây.
 */
@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.css'
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  private subscription?: Subscription;
  private dismissTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private notificationState: NotificationStateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe vào latest notification
    this.subscription = this.notificationState.getLatestNotification()
      .pipe(filter(n => n !== null))
      .subscribe((notification) => {
        this.showToast(notification!);
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
  }

  private showToast(notification: Notification): void {
    // Clear timer cũ nếu có
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }

    this.notification = notification;

    // Auto dismiss sau 5 giây
    this.dismissTimer = setTimeout(() => {
      this.notification = null;
      this.notificationState.clearLatestNotification();
    }, 5000);
  }

  /**
   * Lấy text hiển thị dựa trên loại notification
   */
  getTypeText(type: string): string {
    switch (type) {
      case 'MESSAGE':
        return 'đã gửi tin nhắn';
      case 'LIKE':
        return 'đã thích bài viết của bạn';
      case 'COMMENT':
        return 'đã bình luận';
      case 'FOLLOW':
        return 'đã theo dõi bạn';
      default:
        return '';
    }
  }

  handleClick(): void {
    if (!this.notification) return;

    switch (this.notification.type) {
      case 'MESSAGE':
        // Navigate đến chat với conversation đó
        if (this.notification.conversationId) {
          this.router.navigate(['/chat'], {
            queryParams: { conversationId: this.notification.conversationId }
          });
        }
        break;
      case 'LIKE':
      case 'COMMENT':
        // Navigate đến feed (có thể mở rộng để scroll đến post cụ thể)
        this.router.navigate(['/feed']);
        break;
      case 'FOLLOW':
        // Navigate đến profile người follow
        this.router.navigate(['/people']);
        break;
    }
    this.dismiss();
  }

  dismiss(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
    this.notification = null;
    this.notificationState.clearLatestNotification();
  }

  truncateMessage(message: string): string {
    if (!message) return '';
    return message.length > 50 ? message.substring(0, 47) + '...' : message;
  }
}
