import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';
import { environment } from '../../../../environments/environment';
import { PostResponse } from '../../../core/services/post.service';

/**
 * Service quản lý WebSocket connection cho Feed.
 * Subscribe vào channel /user/queue/feed để nhận bài viết mới real-time.
 */
@Injectable({
    providedIn: 'root'
})
export class FeedSocketService implements OnDestroy {
    private stompClient?: Client;
    private subscription?: StompSubscription;
    private isConnected = false;

    // Subject để emit bài viết mới nhận được
    private newPostSubject = new Subject<PostResponse>();
    public newPost$ = this.newPostSubject.asObservable();

    constructor(private keycloakApi: KeycloakApiService) { }

    /**
     * Kết nối WebSocket và subscribe vào feed channel.
     */
    connect(): void {
        if (this.stompClient?.active || this.isConnected) {
            console.log('[FeedSocket] Already connected');
            return;
        }

        const token = this.keycloakApi.getAccessToken();
        if (!token) {
            console.error('[FeedSocket] No access token – cannot connect WS');
            return;
        }

        // Use wsUrl from environment
        const wsUrl = environment.wsUrl || 'http://localhost:8080/ws';
        const socket = new SockJS(wsUrl);

        this.stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (msg) => console.log('[FeedSocket]', msg),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.stompClient.onConnect = (frame) => {
            console.log('[FeedSocket] Connected:', frame);
            this.isConnected = true;

            // Subscribe vào feed channel
            this.subscription = this.stompClient?.subscribe('/user/queue/feed', (message) => {
                try {
                    const post: PostResponse = JSON.parse(message.body);
                    console.log('[FeedSocket] Received new post:', post);

                    // Emit bài viết mới
                    this.newPostSubject.next(post);
                } catch (e) {
                    console.error('[FeedSocket] Failed to parse post:', e);
                }
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('[FeedSocket] STOMP error:', frame.headers['message']);
            this.isConnected = false;
        };

        this.stompClient.onWebSocketClose = () => {
            console.warn('[FeedSocket] WebSocket closed');
            this.isConnected = false;
        };

        this.stompClient.activate();
    }

    /**
     * Ngắt kết nối WebSocket.
     */
    disconnect(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = undefined;
            this.isConnected = false;
            console.log('[FeedSocket] Disconnected');
        }
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
