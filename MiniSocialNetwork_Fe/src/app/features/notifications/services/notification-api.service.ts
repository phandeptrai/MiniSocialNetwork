import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification, NotificationPage, UnreadCountResponse } from '../models/notification.model';
import { environment } from '../../../../environments/environment';

/**
 * Service để gọi API liên quan đến Notification.
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationApiService {
    private readonly baseUrl = `${environment.apiUrl}/notifications`;

    constructor(private http: HttpClient) { }

    /**
     * Lấy danh sách notifications với phân trang.
     * @param page số trang (bắt đầu từ 0)
     * @param size kích thước mỗi trang
     */
    getNotifications(page: number = 0, size: number = 20): Observable<NotificationPage> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<NotificationPage>(this.baseUrl, { params });
    }

    /**
     * Lấy số lượng notification chưa đọc.
     */
    getUnreadCount(): Observable<UnreadCountResponse> {
        return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`);
    }

    /**
     * Đánh dấu một notification đã đọc.
     * @param id ID của notification
     */
    markAsRead(id: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/read`, {});
    }

    /**
     * Đánh dấu tất cả notifications đã đọc.
     */
    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/read-all`, {});
    }

    /**
     * Đánh dấu các notifications của một conversation đã đọc.
     * @param conversationId ID của conversation
     */
    markConversationAsRead(conversationId: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/conversation/${conversationId}/read`, {});
    }
}
