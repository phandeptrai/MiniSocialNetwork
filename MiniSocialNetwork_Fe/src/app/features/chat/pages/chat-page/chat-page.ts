import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { KeycloakApiService } from '../../../auth/services/keycloak-api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { ChatApiService } from '../../services/chat-api.service'; // Import ChatApiService
import { User } from '../../models/user';
import { ComponentList } from '../component-list/component-list';
import { MessageList } from '../message-list/message-list';
import { MessageInputComponent } from '../message-input/message-input';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-chat-page',
  imports: [ComponentList, MessageList, MessageInputComponent],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage implements OnInit, OnDestroy {
  private keycloakApi = inject(KeycloakApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatState = inject(ChatStateService);
  private chatSocket = inject(ChatSocketService);
  private chatApi = inject(ChatApiService); // Inject ChatApiService

  // Thông tin user hiện tại
  currentUserName = '';
  private currentUserId = '';

  ngOnInit(): void {
    // Lấy thông tin user từ token
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        const currentUser: User = {
          id: claims.sub,
          name: claims.name || claims.preferred_username || '',
          avatarUrl: claims.picture
        };

        this.currentUserName = currentUser.name;
        this.currentUserId = currentUser.id;
        this.chatState.setCurrentUser(currentUser);

        // Load danh sách conversation ban đầu
        this.chatState.setConversationsLoading(true);
        this.chatApi.getConversations().subscribe({
          next: (conversations) => {
            console.log('Loaded conversations:', conversations.length);
            this.chatState.setConversations(conversations);
            this.chatState.setConversationsLoading(false);
          },
          error: (err) => {
            console.error('Failed to load conversations:', err);
            this.chatState.setConversationsLoading(false);
          }
        });

        // Connect WebSocket
        this.chatSocket.connect();

        // Xử lý query params
        this.handleQueryParamsAndSelectConversation();
      }
    }
  }

  /**
   * Đọc thông tin người nhận từ URL và kiểm tra xem đã có conversation chưa
   */
  private handleQueryParamsAndSelectConversation(): void {
    // 1. Xử lý query params ban đầu
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const recipientId = params['recipientId'];
      const recipientName = params['recipientName'];
      const recipientAvatar = params['recipientAvatar'];

      if (recipientId && recipientName) {
        // Set tạm vào Pending Recipient trước để UI hiển thị ngay lập tức
        this.chatState.setPendingRecipient({
          id: recipientId,
          name: recipientName,
          avatarUrl: recipientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientName)}`
        });

        // Lưu vào cache để ComponentList có thể hiển thị tên đúng
        this.chatState.updateUserInfo(recipientId, recipientName, recipientAvatar);

        // Xóa query params khỏi URL để tránh bị process lại, nhưng vẫn giữ pendingRecipient trong state
        this.clearQueryParams();
      }
    });

    // 2. Theo dõi danh sách conversations.
    this.chatState.getConversations().subscribe(conversations => {
      const pending = this.chatState.getPendingRecipientValue();
      if (pending) {
        console.log('Checking for existing conversation with pending recipient:', pending.name);
        console.log('Current loaded conversations:', conversations.length);

        const existingConversation = conversations.find(c => {
          const hasRecipient = c.participantIds.includes(String(pending.id));
          const hasMe = c.participantIds.includes(String(this.currentUserId));

          if (c.type === 'ONE_TO_ONE') {
            console.log(`Checking conv ${c.id}: IDs=[${c.participantIds.join(', ')}] vs Pending=[${pending.id}] & Me=[${this.currentUserId}] -> Match: ${hasRecipient && hasMe}`);
          }

          return c.type === 'ONE_TO_ONE' && hasRecipient && hasMe;
        });

        if (existingConversation) {
          console.log('Found conversation matching pending recipient, switching...', existingConversation.id);
          this.chatState.selectConversation(existingConversation.id);
          this.chatState.setPendingRecipient(null);
        } else {
          console.log('No matching conversation found in current list.');
        }
      }
    });
  }

  private clearQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  logout(): void {
    this.keycloakApi.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.chatSocket.disconnect();
    this.chatState.selectConversation(null);
    this.chatState.setConversations([]);
    this.chatState.setPendingRecipient(null);
  }
}
