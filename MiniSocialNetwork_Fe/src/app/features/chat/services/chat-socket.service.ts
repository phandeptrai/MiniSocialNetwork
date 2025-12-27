import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatStateService } from './chat-state.service';
import { ChatApiService } from './chat-api.service'; // Import ChatApiService
import { UserService } from '../../../core/services/user.service';
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
        private chatApi: ChatApiService, // Inject ChatApiService
        private userService: UserService
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
                    console.log('New conversation identified, fetching conversation detail...', convId);
                    // Fetch single conversation by id and add to state
                    this.chatApi.getConversationById(convId).subscribe({
                        next: newConv => {
                            if (newConv) {
                                // If ONE_TO_ONE, fetch other user's profile to enrich displayName/avatar
                                const currentUser = this.chatState.getCurrentUserValue();
                                if (newConv.type === 'ONE_TO_ONE') {
                                    const otherId = newConv.participantIds.find((id: string) => id !== currentUser?.id) || newConv.participantIds[0];
                                    if (otherId) {
                                        this.userService.getUserById(String(otherId)).subscribe({
                                            next: user => {
                                                newConv.displayName = user.name;
                                                newConv.displayAvatarUrl = user.avatarUrl;
                                                this.chatState.addOrUpdateConversation(newConv);

                                                const pending = this.chatState.getPendingRecipientValue();
                                                if (pending && newConv.participantIds.includes(pending.id)) {
                                                    this.chatState.selectConversation(String(newConv.id));
                                                    this.chatState.setPendingRecipient(null);
                                                }
                                            },
                                            error: () => {
                                                // fallback: still add conversation without displayName
                                                this.chatState.addOrUpdateConversation(newConv);
                                            }
                                        });
                                    } else {
                                        this.chatState.addOrUpdateConversation(newConv);
                                    }
                                } else {
                                    this.chatState.addOrUpdateConversation(newConv);
                                }
                            } else {
                                console.warn('Conversation API did not return conversation for id:', convId);
                            }
                        },
                        error: err => console.error('Failed to fetch conversation by id:', err)
                    });
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
