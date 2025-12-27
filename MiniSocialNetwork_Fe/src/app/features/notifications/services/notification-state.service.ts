import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

/**
 * Service quản lý state cho Notification.
 * Sử dụng BehaviorSubject để reactive state management.
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationStateService {
    // State cho danh sách notifications
    private readonly notifications$ = new BehaviorSubject<Notification[]>([]);

    // State cho số lượng unread
    private readonly unreadCount$ = new BehaviorSubject<number>(0);

    // State cho loading
    private readonly isLoading$ = new BehaviorSubject<boolean>(false);

    // State cho notification mới nhận (dùng cho toast)
    private readonly latestNotification$ = new BehaviorSubject<Notification | null>(null);

    // === SELECTORS ===

    /**
     * Lấy observable cho danh sách notifications.
     */
    getNotifications(): Observable<Notification[]> {
        return this.notifications$.asObservable();
    }

    /**
     * Lấy giá trị hiện tại của danh sách notifications.
     */
    getNotificationsValue(): Notification[] {
        return this.notifications$.getValue();
    }

    /**
     * Lấy observable cho số lượng unread.
     */
    getUnreadCount(): Observable<number> {
        return this.unreadCount$.asObservable();
    }

    /**
     * Lấy giá trị hiện tại của số lượng unread.
     */
    getUnreadCountValue(): number {
        return this.unreadCount$.getValue();
    }

    /**
     * Lấy observable cho loading state.
     */
    isLoading(): Observable<boolean> {
        return this.isLoading$.asObservable();
    }

    /**
     * Lấy observable cho notification mới nhất (dùng cho toast).
     */
    getLatestNotification(): Observable<Notification | null> {
        return this.latestNotification$.asObservable();
    }

    // === ACTIONS ===

    /**
     * Set danh sách notifications.
     */
    setNotifications(notifications: Notification[]): void {
        this.notifications$.next(notifications);
    }

    /**
     * Thêm notifications cũ hơn (cho infinite scroll).
     */
    addOlderNotifications(notifications: Notification[]): void {
        const current = this.notifications$.getValue();
        this.notifications$.next([...current, ...notifications]);
    }

    /**
     * Thêm notification mới vào đầu danh sách.
     * Cũng trigger toast notification.
     */
    addNewNotification(notification: Notification): void {
        const current = this.notifications$.getValue();

        // Kiểm tra trùng lặp
        if (!current.some(n => n.id === notification.id)) {
            this.notifications$.next([notification, ...current]);

            // Tăng unread count nếu chưa đọc
            if (!notification.isRead) {
                this.incrementUnreadCount();
            }

            // Trigger toast
            this.latestNotification$.next(notification);
        }
    }

    /**
     * Clear notification mới nhất (sau khi toast đã hiển thị).
     */
    clearLatestNotification(): void {
        this.latestNotification$.next(null);
    }

    /**
     * Set số lượng unread.
     */
    setUnreadCount(count: number): void {
        this.unreadCount$.next(count);
    }

    /**
     * Tăng unread count lên 1.
     */
    incrementUnreadCount(): void {
        this.unreadCount$.next(this.unreadCount$.getValue() + 1);
    }

    /**
     * Giảm unread count đi 1.
     */
    decrementUnreadCount(): void {
        const current = this.unreadCount$.getValue();
        if (current > 0) {
            this.unreadCount$.next(current - 1);
        }
    }

    /**
     * Đánh dấu một notification đã đọc trong state.
     */
    markAsRead(notificationId: string): void {
        const notifications = this.notifications$.getValue();
        const notification = notifications.find(n => n.id === notificationId);

        if (notification && !notification.isRead) {
            notification.isRead = true;
            this.notifications$.next([...notifications]);
            this.decrementUnreadCount();
        }
    }

    /**
     * Đánh dấu tất cả notifications đã đọc trong state.
     */
    markAllAsRead(): void {
        const notifications = this.notifications$.getValue();
        notifications.forEach(n => n.isRead = true);
        this.notifications$.next([...notifications]);
        this.unreadCount$.next(0);
    }

    /**
     * Đánh dấu các notifications của một conversation đã đọc.
     */
    markConversationAsRead(conversationId: string): void {
        const notifications = this.notifications$.getValue();
        let decrementCount = 0;

        notifications.forEach(n => {
            if (n.conversationId === conversationId && !n.isRead) {
                n.isRead = true;
                decrementCount++;
            }
        });

        if (decrementCount > 0) {
            this.notifications$.next([...notifications]);
            this.unreadCount$.next(Math.max(0, this.unreadCount$.getValue() - decrementCount));
        }
    }

    /**
     * Set loading state.
     */
    setLoading(isLoading: boolean): void {
        this.isLoading$.next(isLoading);
    }

    /**
     * Reset state (ví dụ khi logout).
     */
    reset(): void {
        this.notifications$.next([]);
        this.unreadCount$.next(0);
        this.isLoading$.next(false);
        this.latestNotification$.next(null);
    }
}
