import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for Admin DTOs
export interface AdminDashboard {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalMessages: number;
    totalNotifications: number;
    totalConversations: number;
    totalFollows: number;
}

export interface UserAdmin {
    id: string;
    username: string;
    email: string;
    name: string;
    bio: string;
    avatarUrl: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    followersCount: number;
    followingCount: number;
}

export interface PostAdmin {
    id: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    content: string;
    likeCount: number;
    commentCount: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommentAdmin {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userUsername: string;
    content: string;
    imageUrl: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationAdmin {
    id: string;
    receiverId: string;
    receiverName: string;
    senderId: string;
    senderName: string;
    type: string;
    postId: string;
    conversationId: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface FollowAdmin {
    followerId: string;
    followerName: string;
    followerUsername: string;
    followingId: string;
    followingName: string;
    followingUsername: string;
    createdAt: string;
}

export interface ConversationAdmin {
    id: number;
    name: string;
    type: string;
    createdBy: string;
    lastMessageContent: string;
    lastMessageSenderId: string;
    participantsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface MessageAdmin {
    id: number;
    conversationId: number;
    senderId: string;
    senderName: string;
    content: string;
    messageType: string;
    isDeleted: boolean;
    createdAt: string;
    attachmentsCount: number;
}

/**
 * Service để gọi Admin API endpoints
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);
    private readonly apiUrl = '/api/admin';

    // Dashboard
    getDashboard(): Observable<AdminDashboard> {
        return this.http.get<AdminDashboard>(`${this.apiUrl}/dashboard`);
    }

    // Users
    getAllUsers(): Observable<UserAdmin[]> {
        return this.http.get<UserAdmin[]>(`${this.apiUrl}/users`);
    }

    getUserById(id: string): Observable<UserAdmin> {
        return this.http.get<UserAdmin>(`${this.apiUrl}/users/${id}`);
    }

    updateUser(id: string, data: Partial<UserAdmin>): Observable<UserAdmin> {
        return this.http.put<UserAdmin>(`${this.apiUrl}/users/${id}`, data);
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`);
    }

    // Posts
    getAllPosts(): Observable<PostAdmin[]> {
        return this.http.get<PostAdmin[]>(`${this.apiUrl}/posts`);
    }

    updatePost(id: string, data: Partial<PostAdmin>): Observable<PostAdmin> {
        return this.http.put<PostAdmin>(`${this.apiUrl}/posts/${id}`, data);
    }

    deletePost(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/posts/${id}`);
    }

    // Comments
    getAllComments(): Observable<CommentAdmin[]> {
        return this.http.get<CommentAdmin[]>(`${this.apiUrl}/comments`);
    }

    updateComment(id: string, data: Partial<CommentAdmin>): Observable<CommentAdmin> {
        return this.http.put<CommentAdmin>(`${this.apiUrl}/comments/${id}`, data);
    }

    deleteComment(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/comments/${id}`);
    }

    // Notifications
    getAllNotifications(): Observable<NotificationAdmin[]> {
        return this.http.get<NotificationAdmin[]>(`${this.apiUrl}/notifications`);
    }

    deleteNotification(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/notifications/${id}`);
    }

    // Follows
    getAllFollows(): Observable<FollowAdmin[]> {
        return this.http.get<FollowAdmin[]>(`${this.apiUrl}/follows`);
    }

    deleteFollow(followerId: string, followingId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/follows`, {
            params: { followerId, followingId }
        });
    }

    // Conversations
    getAllConversations(): Observable<ConversationAdmin[]> {
        return this.http.get<ConversationAdmin[]>(`${this.apiUrl}/conversations`);
    }

    deleteConversation(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/conversations/${id}`);
    }

    // Messages
    getAllMessages(): Observable<MessageAdmin[]> {
        return this.http.get<MessageAdmin[]>(`${this.apiUrl}/messages`);
    }

    getMessagesByConversation(conversationId: number): Observable<MessageAdmin[]> {
        return this.http.get<MessageAdmin[]>(`${this.apiUrl}/messages/conversation/${conversationId}`);
    }

    deleteMessage(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/messages/${id}`);
    }
}
