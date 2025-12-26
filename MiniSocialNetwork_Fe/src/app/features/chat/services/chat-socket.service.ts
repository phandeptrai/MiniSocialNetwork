import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatStateService } from './chat-state.service';
import { ChatApiService } from './chat-api.service'; // Import ChatApiService
import { Message } from '../models/message';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';
import { DeleteMessageEvent } from '../models/events';

@Injectable({
    providedIn: 'root'
})
export class ChatSocketService {

    private stompClient?: Client;

    constructor(
        private keycloakApi: KeycloakApiService,
        private chatState: ChatStateService,
        private chatApi: ChatApiService // Inject ChatApiService
    ) { }

    public connect(): void {
        if (this.stompClient?.active) {
            console.log('STOMP already connected');
            return;
        }

        const token = this.keycloakApi.getAccessToken();
        if (!token) {
            console.error('No access token – cannot connect WS');
            return;
        }

        // 🔥 QUAN TRỌNG: KHÔNG gắn token vào URL
        const socket = new SockJS('http://localhost:8080/ws');

        this.stompClient = new Client({
            webSocketFactory: () => socket,

            // 👉 JWT được gửi ở CONNECT HEADER
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },

            debug: (msg) => console.log('[STOMP]', msg),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.stompClient.onConnect = (frame) => {
            console.log('STOMP connected:', frame);

            // ✅ Private queue
            this.stompClient?.subscribe('/user/queue/messages', (msg) => {
                const message: Message = JSON.parse(msg.body);
                const convId = message.conversationId;

                // Kiểm tra xem conversation này đã có trong state chưa
                const existingConv = this.chatState.getConversationsValue().find(c => c.id === convId);

                if (!existingConv) {
                    console.log('New conversation identified, fetching updates in 500ms...', convId);

                    // Thêm delay để đảm bảo Backend commit transaction xong
                    setTimeout(() => {
                        this.chatApi.getConversations().subscribe(convs => {
                            console.log('Fetched updated conversations:', convs.length);
                            this.chatState.setConversations(convs);

                            // Kiểm tra Pending Recipient
                            const pending = this.chatState.getPendingRecipientValue();
                            if (pending) {
                                // Nếu đang có pending recipient 
                                // Tìm conversation vừa tạo (nếu API trả về kịp)
                                const newConv = convs.find(c => c.id === convId);
                                if (newConv) {
                                    this.chatState.selectConversation(convId);
                                    this.chatState.setPendingRecipient(null);
                                } else {
                                    console.warn('Still not found conversation after fetch. API lag?');
                                }
                            }
                        });
                    }, 500);
                }

                this.chatState.addMessage(
                    message.conversationId,
                    message
                );

                this.chatState.updateConversationPreview(
                    message.conversationId,
                    message
                );

                // Đánh dấu conversation có tin nhắn mới nếu:
                // 1. Tin nhắn từ người khác (không phải current user)
                // 2. Conversation hiện tại không đang được chọn (user không đang xem)
                const currentUser = this.chatState.getCurrentUserValue();
                const selectedConvId = this.chatState.getSelectedConversationValue()?.id;

                if (currentUser && message.senderId !== currentUser.id) {
                    // Nếu user không đang xem conversation này -> mark unread
                    if (selectedConvId !== message.conversationId) {
                        this.chatState.markConversationUnread(message.conversationId);
                        console.log('New message from other user, marking conversation as unread:', message.conversationId);
                    }
                }
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('STOMP error:', frame.headers['message']);
            console.error(frame.body);
        };

        this.stompClient.onWebSocketClose = () => {
            console.warn('WebSocket closed');
        };

        this.stompClient.activate();
    }

    public sendMessage(payload: {
        conversationId?: string;
        recipientId?: string;
        content: string;
        attachments?: any[];
    }): void {
        if (!this.stompClient?.active) {
            console.error('STOMP not connected');
            return;
        }

        this.stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(payload)
        });
    }

    public disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = undefined;
            console.log('STOMP disconnected');
        }
    }

    private currentConvSubscription: any;
    public subscribeToConversationTopic(conversationId: string): void {
        if (!this.stompClient?.connected) {
            console.warn('STOMP not connected yet');
            return;
        }

        if (this.currentConvSubscription) {
            this.currentConvSubscription.unsubscribe();
        }

        this.currentConvSubscription =
            this.stompClient.subscribe(
                `/topic/conversation/${conversationId}`,
                (message) => {
                    const event: DeleteMessageEvent = JSON.parse(message.body);
                    console.log('Received delete event:', event);

                    // Cập nhật message thành đã xóa trong state
                    if (event.messageId && event.conversationId) {
                        this.chatState.markMessageAsDeleted(event.conversationId, event.messageId);
                    }
                }
            );
    }


    public requestDeleteMessage(messageId: string): void {
        if (!this.stompClient?.active) return;
        this.stompClient.publish({
            destination: '/app/chat.deleteMessage',
            body: JSON.stringify({ messageId })
        });
    }
}
