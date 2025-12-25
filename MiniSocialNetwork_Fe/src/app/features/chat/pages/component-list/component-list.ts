import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Conversation } from '../../models/conversation';
import { User } from '../../models/user';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatApiService } from '../../services/chat-api.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-component-list',
  imports: [CommonModule],
  templateUrl: './component-list.html',
  styleUrl: './component-list.css',
})
export class ComponentList implements OnInit, OnDestroy {
  @ViewChild('conversationsWrapper') private conversationsWrapper!: ElementRef;

  conversations$: Observable<Conversation[]>;
  selectedConversation$: Observable<Conversation | null>;
  isLoading$: Observable<boolean>;

  private currentUser: User | null = null;
  private tokenSub?: Subscription;
  private isLoadingMore = false;
  private hasMoreConversations = true;
  private oldestCursor: { updatedAt: string; id: string } | null = null;

  constructor(
    private chatState: ChatStateService,
    private chatApi: ChatApiService,
    private authService: AuthService
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

        // Cập nhật cursor cho infinite scroll
        if (conversations.length > 0) {
          const oldest = conversations[conversations.length - 1];
          this.oldestCursor = { updatedAt: oldest.updatedAt, id: oldest.id };
          this.hasMoreConversations = conversations.length >= 20;
        }
      },
      error: err => {
        console.error("Failed to load conversations:", err);
        this.chatState.setConversationsLoading(false);
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.chatState.selectConversation(conversation.id);
  }

  startNewConversation(): void {
    // Logic để mở modal chọn bạn bè sẽ được triển khai sau
    console.log("Starting a new conversation...");
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    // Load thêm khi scroll gần cuối (< 100px từ bottom)
    if (scrollBottom < 100 && !this.isLoadingMore && this.hasMoreConversations) {
      this.loadMoreConversations();
    }
  }

  private loadMoreConversations(): void {
    if (!this.oldestCursor) return;

    this.isLoadingMore = true;
    this.chatApi.getConversations(this.oldestCursor.updatedAt, this.oldestCursor.id).subscribe({
      next: olderConversations => {
        if (olderConversations.length > 0) {
          // Không cần process ở đây nữa
          this.chatState.addOlderConversations(olderConversations);

          const oldest = olderConversations[olderConversations.length - 1];
          this.oldestCursor = { updatedAt: oldest.updatedAt, id: oldest.id };
          this.hasMoreConversations = olderConversations.length >= 20;
        } else {
          this.hasMoreConversations = false;
        }
        this.isLoadingMore = false;
      },
      error: err => {
        console.error("Failed to load more conversations:", err);
        this.isLoadingMore = false;
      }
    });
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
          const cachedUser = this.chatState.getUserInfo(otherParticipantId);
          if (cachedUser) {
            conv.displayName = cachedUser.name;
            conv.displayAvatarUrl = cachedUser.avatarUrl;
          } else {
            // Fallback: Hiển thị ID (Sau này cần gọi API lấy User Profile)
            conv.displayName = `User ${otherParticipantId.substring(0, 8)}...`;
            conv.displayAvatarUrl = `https://i.pravatar.cc/40?u=${otherParticipantId}`;
          }
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
