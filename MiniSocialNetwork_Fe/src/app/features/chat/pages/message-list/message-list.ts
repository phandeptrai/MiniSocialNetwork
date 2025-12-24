import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Message } from '../../models/message';
import { Conversation } from '../../models/conversation';
import { User } from '../../models/user';
import { ChatApiService } from '../../services/chat-api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { ChatSocketService } from '../../services/chat-socket.service';
import { CommonModule } from '@angular/common';
import { MessageItem } from '../message-item/message-item';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, MessageItem],
  templateUrl: './message-list.html',
  styleUrl: './message-list.css',
})
export class MessageList implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  messages$: Observable<Message[]>;
  selectedConversation$: Observable<Conversation | null>;
  isLoading$: Observable<boolean>;
  private shouldScrollToBottom = false;
  private messageCount = 0;
  private oldestMessageId: string | null = null;
  private hasMoreMessages = true;

  private conversationSub!: Subscription;
  private messagesSub!: Subscription;
  private currentUser: User | null = null;

  constructor(
    private chatApi: ChatApiService,
    private chatState: ChatStateService,
    private chatSocket: ChatSocketService
  ) {
    this.messages$ = this.chatState.getMessagesForSelectedConversation();
    this.selectedConversation$ = this.chatState.getSelectedConversation();
    this.isLoading$ = this.chatState.isMessagesLoading();
  }

  ngOnInit(): void {
    this.currentUser = this.chatState.getCurrentUserValue();

    // Theo dõi thay đổi messages để scroll xuống cuối
    this.messagesSub = this.messages$.pipe(
      tap(messages => {
        if (messages.length > this.messageCount) {
          this.shouldScrollToBottom = true;
        }
        this.messageCount = messages.length;
      })
    ).subscribe();

    // Theo dõi conversation được chọn để load messages
    this.conversationSub = this.chatState.getSelectedConversationId().pipe(
      distinctUntilChanged(),
      filter(id => id !== null)
    ).subscribe(conversationId => {
      if (conversationId) {
        this.resetScrollState();
        this.loadInitialMessages(conversationId);
        this.chatSocket.subscribeToConversationTopic(conversationId);
      }
    });
  }

  ngOnDestroy(): void {
    this.conversationSub?.unsubscribe();
    this.messagesSub?.unsubscribe();
  }

  onScrollUp(): void {
    const element = this.scrollContainer.nativeElement;
    // Chỉ load thêm khi scroll gần đầu trang (< 100px từ top)
    if (element.scrollTop > 100) {
      return;
    }
    
    if (this.chatState.getIsMessagesLoadingValue() || !this.hasMoreMessages) {
      return;
    }
    const currentConv = this.chatState.getSelectedConversationValue();

    if (currentConv && this.oldestMessageId) {
      this.chatState.setMessagesLoading(true);
      const oldScrollHeight = this.scrollContainer.nativeElement.scrollHeight;

      this.chatApi.getMessages(currentConv.id, this.oldestMessageId).subscribe(olderMessages => {
        if (olderMessages.length > 0) {
          const processedOlderMessages = this.processMessages(olderMessages.reverse());
          this.chatState.addOlderMessages(currentConv.id, processedOlderMessages);
          this.oldestMessageId = processedOlderMessages[0]?.id ?? null;
          this.hasMoreMessages = olderMessages.length >= 30;

          // Giữ nguyên vị trí scroll sau khi thêm tin nhắn cũ
          // Dùng requestAnimationFrame để đảm bảo DOM đã được cập nhật
          requestAnimationFrame(() => {
            const newScrollHeight = this.scrollContainer.nativeElement.scrollHeight;
            this.scrollContainer.nativeElement.scrollTop = newScrollHeight - oldScrollHeight;
          });

        } else {
          this.hasMoreMessages = false;
        }
        this.chatState.setMessagesLoading(false);
      });
    } else {
      this.chatState.setMessagesLoading(false);
    }
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id; // Tối ưu hóa render cho *ngFor
  }

  private processMessages(messages: Message[]): Message[] {
    return messages.map(msg => ({
      ...msg,
      isSender: msg.senderId === this.currentUser?.id
    }));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      // Reset cờ để tránh cuộn lại ở các chu kỳ kiểm tra sau
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Bỏ qua lỗi nếu element chưa sẵn sàng
    }
  }

  private resetScrollState(): void {
    this.oldestMessageId = null;
    this.hasMoreMessages = true;
    this.messageCount = 0;
  }

  private loadInitialMessages(conversationId: string): void {
    this.chatState.setMessagesLoading(true);
    this.chatApi.getMessages(conversationId).subscribe(messages => {
      const sortedMessages = this.processMessages(messages.reverse());
      this.chatState.setMessages(conversationId, sortedMessages);
      this.oldestMessageId = sortedMessages[0]?.id ?? null;
      this.hasMoreMessages = messages.length >= 30; // Page size là 30
      this.chatState.setMessagesLoading(false);
      this.shouldScrollToBottom = true;
    });
  }

  private isScrolledToBottom(): boolean {
    if (!this.scrollContainer) return true;
    const el = this.scrollContainer.nativeElement;
    // Thêm một khoảng đệm nhỏ (ví dụ 5px) để chắc chắn
    return el.scrollHeight - el.scrollTop - el.clientHeight < 5;
  }
}
