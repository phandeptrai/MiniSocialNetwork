import { Injectable, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationStateService } from './notification-state.service';
import { NotificationApiService } from './notification-api.service';
import { Notification } from '../models/notification.model';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';
import { environment } from '../../../../environments/environment';

/**
 * Service quản lý WebSocket connection cho Notifications.
 * Subscribe vào channel /user/queue/notifications để nhận thông báo real-time.
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationSocketService implements OnDestroy {
    private stompClient?: Client;
    private isConnected = false;

    constructor(
        private keycloakApi: KeycloakApiService,
        private notificationState: NotificationStateService,
        private notificationApi: NotificationApiService
    ) { }

    /**
     * Kết nối WebSocket và subscribe vào notification channel.
     */
    connect(): void {
        if (this.stompClient?.active || this.isConnected) {
            console.log('[NotificationSocket] Already connected');
            return;
        }

        const token = this.keycloakApi.getAccessToken();
        if (!token) {
            console.error('[NotificationSocket] No access token – cannot connect WS');
            return;
        }

        // Load unread count ban đầu từ API
        this.loadUnreadCount();

        // Use wsUrl from environment
        const wsUrl = environment.wsUrl || 'http://localhost:8080/ws';
        const socket = new SockJS(wsUrl);

        this.stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (msg) => console.log('[NotificationSocket]', msg),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.stompClient.onConnect = (frame) => {
            console.log('[NotificationSocket] Connected:', frame);
            this.isConnected = true;

            // Subscribe vào notification channel
            this.stompClient?.subscribe('/user/queue/notifications', (message) => {
                try {
                    const notification: Notification = JSON.parse(message.body);
                    console.log('[NotificationSocket] Received notification:', notification);

                    // Thêm vào state (sẽ trigger toast)
                    this.notificationState.addNewNotification(notification);
                } catch (e) {
                    console.error('[NotificationSocket] Failed to parse notification:', e);
                }
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('[NotificationSocket] STOMP error:', frame.headers['message']);
            this.isConnected = false;
        };

        this.stompClient.onWebSocketClose = () => {
            console.warn('[NotificationSocket] WebSocket closed');
            this.isConnected = false;
        };

        this.stompClient.activate();
    }

    /**
     * Ngắt kết nối WebSocket.
     */
    disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = undefined;
            this.isConnected = false;
            console.log('[NotificationSocket] Disconnected');
        }
    }

    /**
     * Load số lượng unread từ API.
     */
    private loadUnreadCount(): void {
        this.notificationApi.getUnreadCount().subscribe({
            next: (response) => {
                this.notificationState.setUnreadCount(response.count);
                console.log('[NotificationSocket] Loaded unread count:', response.count);
            },
            error: (err) => {
                console.error('[NotificationSocket] Failed to load unread count:', err);
            }
        });
    }

    /**
     * Kiểm tra trạng thái kết nối.
     */
    isActive(): boolean {
        return this.isConnected && (this.stompClient?.active ?? false);
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
