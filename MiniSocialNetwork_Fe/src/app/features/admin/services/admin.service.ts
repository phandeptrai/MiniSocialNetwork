import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces for Admin DTOs
export interface AdminDashboard {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
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

export interface PostStatistics {
    labels: string[];
    values: number[];
    totalPosts: number;
}

/**
 * Service để gọi Admin API endpoints
 * Quản lý Users, Posts, Comments
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);
    private readonly apiUrl = '/api/admin';

    // Dashboard
    getDashboard(): Observable<AdminDashboard> {
        return this.http.get<AdminDashboard>(`${this.apiUrl}/dashboard`);
    }

    // Statistics
    getPostStatistics(days: number = 7): Observable<PostStatistics> {
        return this.http.get<PostStatistics>(`${this.apiUrl}/statistics/posts?days=${days}`);
    }

    // Sync users from Keycloak to MySQL
    syncUsersFromKeycloak(): Observable<{ message: string; syncedCount: number }> {
        return this.http.post<{ message: string; syncedCount: number }>(`${this.apiUrl}/sync-users`, {});
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
}
