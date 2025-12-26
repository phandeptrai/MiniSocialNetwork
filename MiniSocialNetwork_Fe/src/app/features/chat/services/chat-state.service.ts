import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Conversation } from '../models/conversation';
import { Message } from '../models/message';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  // === PRIVATE STATE ===
  private readonly currentUser$ = new BehaviorSubject<User | null>(null);
  private readonly conversations$ = new BehaviorSubject<Conversation[]>([]);
  private readonly selectedConversationId$ = new BehaviorSubject<string | null>(null);
  private readonly messages$ = new BehaviorSubject<Record<string, Message[]>>({});
  private readonly conversationsLoading$ = new BehaviorSubject<boolean>(false);
  private readonly messagesLoading$ = new BehaviorSubject<boolean>(false);

  // Cache thông tin user để hiển thị tên/avatar (do API conversation chỉ trả về ID)
  private readonly userCache = new Map<string, { name: string; avatarUrl: string }>();

  // === PUBLIC SELECTORS ===
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  updateUserInfo(id: string, name: string, avatarUrl: string): void {
    if (id && name) {
      this.userCache.set(id, { name, avatarUrl });
    }
  }

  getUserInfo(id: string): { name: string; avatarUrl: string } | undefined {
    return this.userCache.get(id);
  }

  getCurrentUserValue(): User | null {
    return this.currentUser$.getValue();
  }

  getConversations(): Observable<Conversation[]> {
    return this.conversations$.asObservable();
  }

  getConversationsValue(): Conversation[] {
    return this.conversations$.getValue();
  }

  getSelectedConversationId(): Observable<string | null> {
    return this.selectedConversationId$.asObservable();
  }

  getSelectedConversation(): Observable<Conversation | null> {
    return combineLatest([this.selectedConversationId$, this.conversations$]).pipe(
      map(([selectedId, conversations]) =>
        selectedId ? conversations.find(c => c.id === selectedId) || null : null
      ),
      distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
    );
  }

  getSelectedConversationValue(): Conversation | null {
    const selectedId = this.selectedConversationId$.getValue();
    return selectedId ? this.conversations$.getValue().find(c => c.id === selectedId) || null : null;
  }

  getMessagesForSelectedConversation(): Observable<Message[]> {
    // Kết hợp cả selectedConversationId$ và messages$ để reactive với cả hai thay đổi
    return combineLatest([this.selectedConversationId$, this.messages$]).pipe(
      map(([selectedId, messagesMap]) => {
        if (!selectedId) return [];
        return messagesMap[selectedId] || [];
      })
    );
  }

  isConversationsLoading(): Observable<boolean> {
    return this.conversationsLoading$.asObservable();
  }

  isMessagesLoading(): Observable<boolean> {
    return this.messagesLoading$.asObservable();
  }

  getIsMessagesLoadingValue(): boolean {
    return this.messagesLoading$.getValue();
  }

  // === PUBLIC ACTIONS ===
  setCurrentUser(user: User | null): void {
    this.currentUser$.next(user);
  }

  selectConversation(conversationId: string | null): void {
    this.selectedConversationId$.next(conversationId);
  }

  setConversationsLoading(isLoading: boolean): void { this.conversationsLoading$.next(isLoading); }

  setConversations(conversations: Conversation[]): void {
    this.conversations$.next(conversations);
  }

  addOlderConversations(olderConversations: Conversation[]): void {
    const current = this.conversations$.getValue();
    this.conversations$.next([...current, ...olderConversations]);
  }

  setMessagesLoading(isLoading: boolean): void { this.messagesLoading$.next(isLoading); }

  setMessages(conversationId: string, messages: Message[]): void {
    const currentMessagesState = this.messages$.getValue();
    this.messages$.next({ ...currentMessagesState, [conversationId]: messages });
  }

  addOlderMessages(conversationId: string, olderMessages: Message[]): void {
    const currentMessagesState = this.messages$.getValue();
    const existingMessages = currentMessagesState[conversationId] || [];
    this.messages$.next({ ...currentMessagesState, [conversationId]: [...olderMessages, ...existingMessages] });
  }

  addMessage(conversationId: string, message: Message): void {
    const currentMessagesState = this.messages$.getValue();
    const existingMessages = currentMessagesState[conversationId] || [];
    if (existingMessages.some(m => m.id === message.id || (m.tempId && m.tempId === message.tempId))) {
      return;
    }
    this.messages$.next({ ...currentMessagesState, [conversationId]: [...existingMessages, message] });
  }

  // Action để cập nhật một tin nhắn (ví dụ: gỡ tin, cập nhật trạng thái từ 'sending' sang 'sent')
  updateMessage(conversationId: string, updatedMessage: Message): void {
    const currentMessagesState = this.messages$.getValue();
    const existingMessages = currentMessagesState[conversationId] || [];
    const messageIndex = existingMessages.findIndex(m => m.id === updatedMessage.id || m.tempId === updatedMessage.tempId);

    if (messageIndex > -1) {
      const updatedMessages = [...existingMessages];
      updatedMessages[messageIndex] = updatedMessage;
      this.messages$.next({ ...currentMessagesState, [conversationId]: updatedMessages });
    }
  }

  // Action để đánh dấu tin nhắn đã bị xóa (soft delete)
  markMessageAsDeleted(conversationId: string, messageId: string): void {
    const currentMessagesState = this.messages$.getValue();
    const existingMessages = currentMessagesState[conversationId] || [];
    const messageIndex = existingMessages.findIndex(m => m.id === messageId);

    if (messageIndex > -1) {
      const updatedMessages = [...existingMessages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        isDeleted: true,
        content: '' // Xóa nội dung
      };
      this.messages$.next({ ...currentMessagesState, [conversationId]: updatedMessages });
    }
  }

  // Action để cập nhật thông tin mới nhất cho một cuộc hội thoại
  updateConversationPreview(conversationId: string, message: Message): void {
    const currentConversations = this.conversations$.getValue();
    const convIndex = currentConversations.findIndex(c => c.id === conversationId);

    if (convIndex > -1) {
      const updatedConv = {
        ...currentConversations[convIndex],
        lastMessageContent: message.content,
        lastMessageSenderId: message.senderId,
        lastMessageType: message.messageType,
        updatedAt: message.createdAt
      };

      const sortedConversations = [
        updatedConv,
        ...currentConversations.filter(c => c.id !== conversationId)
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      this.conversations$.next(sortedConversations);
    }
  }

  // === PENDING RECIPIENT STATE (New Logic) ===
  // State lưu thông tin người nhận khi chưa có conversation thật
  private readonly pendingRecipient$ = new BehaviorSubject<PendingRecipient | null>(null);

  getPendingRecipient(): Observable<PendingRecipient | null> {
    return this.pendingRecipient$.asObservable();
  }

  getPendingRecipientValue(): PendingRecipient | null {
    return this.pendingRecipient$.getValue();
  }

  setPendingRecipient(recipient: PendingRecipient | null): void {
    this.pendingRecipient$.next(recipient);
  }

  // === UNREAD CONVERSATIONS STATE ===
  // Theo dõi các conversation có tin nhắn chưa đọc
  private readonly unreadConversationIds$ = new BehaviorSubject<Set<string>>(new Set());

  /**
   * Lấy observable cho Set các conversation IDs có tin nhắn chưa đọc.
   */
  getUnreadConversationIds(): Observable<Set<string>> {
    return this.unreadConversationIds$.asObservable();
  }

  /**
   * Kiểm tra xem một conversation có tin nhắn chưa đọc không.
   */
  isConversationUnread(conversationId: string): boolean {
    return this.unreadConversationIds$.getValue().has(conversationId);
  }

  /**
   * Đánh dấu một conversation có tin nhắn mới (unread).
   */
  markConversationUnread(conversationId: string): void {
    const current = this.unreadConversationIds$.getValue();
    if (!current.has(conversationId)) {
      const updated = new Set(current);
      updated.add(conversationId);
      this.unreadConversationIds$.next(updated);
      console.log('Marked conversation as unread:', conversationId);
    }
  }

  /**
   * Đánh dấu một conversation đã đọc (remove from unread set).
   */
  markConversationRead(conversationId: string): void {
    const current = this.unreadConversationIds$.getValue();
    if (current.has(conversationId)) {
      const updated = new Set(current);
      updated.delete(conversationId);
      this.unreadConversationIds$.next(updated);
      console.log('Marked conversation as read:', conversationId);
    }
  }

  /**
   * Reset tất cả unread conversations.
   */
  clearAllUnread(): void {
    this.unreadConversationIds$.next(new Set());
  }
}

// Interface mới cho Pending Recipient
export interface PendingRecipient {
  id: string;
  name: string;
  avatarUrl: string;
}