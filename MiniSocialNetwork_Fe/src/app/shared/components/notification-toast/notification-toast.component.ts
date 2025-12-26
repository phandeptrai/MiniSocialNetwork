import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NotificationStateService } from '../../../features/notifications/services/notification-state.service';
import { Notification } from '../../../features/notifications/models/notification.model';

/**
 * Component hiển thị toast notification khi nhận tin nhắn mới.
 * Auto dismiss sau 5 giây.
 */
@Component({
    selector: 'app-notification-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container" *ngIf="notification">
      <div class="toast" (click)="handleClick()" [@fadeInOut]>
        <div class="toast-avatar">
          <img [src]="notification.senderAvatarUrl" [alt]="notification.senderName" />
        </div>
        <div class="toast-content">
          <div class="toast-header">
            <span class="toast-sender">{{ notification.senderName }}</span>
            <span class="toast-type">đã gửi tin nhắn</span>
          </div>
          <div class="toast-message">{{ truncateMessage(notification.message) }}</div>
        </div>
        <button class="toast-close" (click)="dismiss($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(29, 161, 242, 0.2);
      min-width: 320px;
      max-width: 420px;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease-out;
    }

    .toast:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      border: 2px solid #1da1f2;
    }

    .toast-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-header {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 4px;
    }

    .toast-sender {
      font-weight: 700;
      color: #14171a;
      font-size: 15px;
    }

    .toast-type {
      color: #657786;
      font-size: 13px;
    }

    .toast-message {
      color: #14171a;
      font-size: 14px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toast-close {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #657786;
      padding: 0;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: #f5f8fa;
      color: #e0245e;
    }

    .toast-close svg {
      width: 16px;
      height: 16px;
    }
  `]
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

    handleClick(): void {
        if (this.notification?.conversationId) {
            // Navigate đến chat với conversation đó
            this.router.navigate(['/chat'], {
                queryParams: { conversationId: this.notification.conversationId }
            });
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
