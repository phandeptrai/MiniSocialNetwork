import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Conversation } from '../models/conversation';
import { Message, Attachment } from '../models/message';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  // Proxy sẽ tự động điều hướng các request bắt đầu bằng /api
  private readonly API_URL = '/api';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách các cuộc hội thoại của người dùng, hỗ trợ phân trang.
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.API_URL}/conversations`);
  }

  getConversationById(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.API_URL}/conversations/${id}`);
  }

  /**
   * Lấy lịch sử tin nhắn của một cuộc hội thoại, hỗ trợ phân trang.
   */
  getMessages(conversationId: string, cursor?: string, size = 30): Observable<Message[]> {
    let params = new HttpParams().set('size', size.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }
    return this.http.get<Message[]>(`${this.API_URL}/conversations/${conversationId}/messages`, { params });
  }

  /**
   * Upload một hoặc nhiều file đính kèm.
   */
  uploadAttachments(files: File[], conversationId?: string, recipientId?: string): Observable<Attachment[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));

    if (conversationId) {
      formData.append('conversationId', conversationId);
    } else if (recipientId) {
      formData.append('recipientId', recipientId);
    }

    return this.http.post<Attachment[]>(`${this.API_URL}/attachments`, formData);
  }

  /**
   * Lấy danh sách người dùng để bắt đầu cuộc hội thoại mới.
   * (API này cần được tạo ở backend nếu chưa có)
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`);
  }
}