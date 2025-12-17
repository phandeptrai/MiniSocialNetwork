import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakApiService } from '../../../auth/services/keycloak-api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { User } from '../../models/user';
import { ComponentList } from '../component-list/component-list';
import { MessageList } from '../message-list/message-list';
import { MessageInputComponent } from '../message-input/message-input';

@Component({
  selector: 'app-chat-page',
  imports: [ComponentList, MessageList, MessageInputComponent],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage {
  private keycloakApi = inject(KeycloakApiService);
  private router = inject(Router);
  private chatState = inject(ChatStateService);
  private chatSocket = inject(ChatSocketService);

  // Thông tin user hiện tại
  currentUserName = '';

  ngOnInit(): void {
    // Lấy thông tin user từ token
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        const currentUser: User = {
          id: claims.sub,
          name: claims.name || claims.preferred_username || 'User',
          avatarUrl: claims.picture
        };

        this.currentUserName = currentUser.name;
        this.chatState.setCurrentUser(currentUser);

        // Connect WebSocket sau khi có user info
        this.chatSocket.connect();
      }
    }
  }

  logout(): void {
    this.keycloakApi.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    // Ngắt kết nối WebSocket khi component bị hủy
    this.chatSocket.disconnect();
    // Reset state khi rời khỏi trang chat
    this.chatState.selectConversation(null);
    this.chatState.setConversations([]);
  }
}
