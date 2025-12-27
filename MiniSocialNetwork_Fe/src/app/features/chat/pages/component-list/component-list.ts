import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Conversation } from '../../models/conversation';
import { User } from '../../models/user';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatApiService } from '../../services/chat-api.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';
import { NotificationApiService } from '../../../notifications/services/notification-api.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-component-list',
  imports: [CommonModule],
  templateUrl: './component-list.html',
  styleUrl: './component-list.css',
})
export class ComponentList implements OnInit, OnDestroy {
  conversations$: Observable<Conversation[]>;
  selectedConversation$: Observable<Conversation | null>;
  isLoading$: Observable<boolean>;
  unreadConversationIds$: Observable<Set<string>>;

  private currentUser: User | null = null;
  private tokenSub?: Subscription;
  

  constructor(
    private chatState: ChatStateService,
    private chatApi: ChatApiService,
    private authService: AuthService,
    private notificationApi: NotificationApiService,
    private userService: UserService
  ) {
    // Process conversations mỗi khi có dữ liệu mới từ state HOẶC user thay đổi
    this.conversations$ = combineLatest([
      this.chatState.getConversations(),
      this.chatState.getCurrentUser()
    ]).pipe(
      map(([conversations, user]) => {
        this.currentUser = user;
        console.log('Processing conversations with user:', user?.id, 'Count:', conversations.length);
        return this.processConversations(conversations);
      })
    );
    this.selectedConversation$ = this.chatState.getSelectedConversation();
    this.isLoading$ = this.chatState.isConversationsLoading();
    this.unreadConversationIds$ = this.chatState.getUnreadConversationIds();
  }

  ngOnInit(): void {
    // Đợi token sẵn sàng trước khi gọi API
    this.tokenSub = this.authService.tokenReady$
      .pipe(filter(ready => ready))
      .subscribe(() => {
        this.currentUser = this.chatState.getCurrentUserValue();
        this.loadConversations();
      });
  }

  ngOnDestroy(): void {
    this.tokenSub?.unsubscribe();
  }

  private loadConversations(): void {
    this.chatState.setConversationsLoading(true);
    this.chatApi.getConversations().subscribe({
      next: conversations => {
        // Không cần process ở đây nữa vì đã làm trong pipe map
        this.chatState.setConversations(conversations);
        this.chatState.setConversationsLoading(false);
      },
      error: err => {
        console.error("Failed to load conversations:", err);
        this.chatState.setConversationsLoading(false);
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.chatState.selectConversation(conversation.id);

    // Đánh dấu conversation đã đọc
    this.chatState.markConversationRead(conversation.id);

    // Gọi API để đánh dấu notifications của conversation này đã đọc
    this.notificationApi.markConversationAsRead(conversation.id).subscribe({
      next: () => console.log('Marked conversation notifications as read:', conversation.id),
      error: (err) => console.error('Failed to mark conversation as read:', err)
    });
  }

  /**
   * Kiểm tra xem conversation có unread messages không.
   * Được gọi từ template để hiển thị unread indicator.
   */
  hasUnread(conversationId: string): boolean {
    return this.chatState.isConversationUnread(conversationId);
  }

  startNewConversation(): void {
    // Logic để mở modal chọn bạn bè sẽ được triển khai sau
    console.log("Starting a new conversation...");
  }

  

  // Hàm này tìm tên và avatar của người còn lại trong chat 1-1
  private processConversations(conversations: Conversation[]): Conversation[] {
    return conversations.map(conv => {
      if (conv.type === 'ONE_TO_ONE') {
        let otherParticipantId = conv.participantIds.find(id => id !== this.currentUser?.id);

        // Nếu không tìm thấy người khác (chat với chính mình), lấy ID đầu tiên
        if (!otherParticipantId && conv.participantIds.length > 0) {
          otherParticipantId = conv.participantIds[0];
        }

        if (otherParticipantId) {
          // Thử lấy từ Cache trước
          // const cachedUser = this.chatState.getUserInfo(otherParticipantId);
          // if (cachedUser) {
          //   conv.displayName = cachedUser.name;
          //   conv.displayAvatarUrl = cachedUser.avatarUrl;
          // } else {
          //   // Fallback: Hiển thị ID (Sau này cần gọi API lấy User Profile)
          //   conv.displayName = `User ${otherParticipantId.substring(0, 8)}...`;
          //   conv.displayAvatarUrl = `https://i.pravatar.cc/40?u=${otherParticipantId}`;
          // }
          this.userService.getUserById(otherParticipantId!).subscribe(user => {
            conv.displayName = user.name;
            conv.displayAvatarUrl = user.avatarUrl;
          });
        } else {
          conv.displayName = "Unknown User";
        }
      } else {
        conv.displayName = conv.name || 'Group Chat';
      }
      return conv;
    });
  }
}
