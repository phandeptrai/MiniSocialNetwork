import { Component } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { User } from '../../models/user';
import { ComponentList } from '../component-list/component-list';
import { MessageList } from '../message-list/message-list';
import { MessageInputComponent } from '../message-input/message-input';
import { filter } from 'rxjs/internal/operators/filter';

@Component({
  selector: 'app-chat-page',
  imports: [ComponentList, MessageList, MessageInputComponent],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage {
  constructor(
    private authService: AuthService,
    private chatState: ChatStateService,
    private chatSocket: ChatSocketService
  ) { }

  ngOnInit(): void {
    this.authService.tokenReady$
      .pipe(filter(ready => ready))
      .subscribe(() => {

        // 1️⃣ Lúc này token + claims ĐÃ SẴN SÀNG
        const claims = this.authService.getIdentityClaims();
        if (!claims) {
          console.error('Claims still missing after tokenReady');
          return;
        }

        const currentUser: User = {
          id: claims.sub,
          name: claims.name || claims.preferred_username,
          avatarUrl: claims.picture
        };

        this.chatState.setCurrentUser(currentUser);

        // 2️⃣ BÂY GIỜ mới connect WS
        this.chatSocket.connect();
      });
  }

  ngOnDestroy(): void {
    // Ngắt kết nối WebSocket khi component bị hủy
    this.chatSocket.disconnect();
    // Reset state khi rời khỏi trang chat
    this.chatState.selectConversation(null);
    this.chatState.setConversations([]);
  }
}
