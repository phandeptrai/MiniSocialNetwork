import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    name: string;
    bio: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileRequest {
    name?: string;
    bio?: string;
    avatarUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/users';

    /**
     * Get current user's profile
     */
    getMyProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/me`);
    }

    /**
     * Update current user's profile
     */
    updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.apiUrl}/me`, request);
    }

    getUserById(userId: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
    }
}
