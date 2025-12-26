import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserCard {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    bio: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    followsYou?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PeopleService {
    private readonly http = inject(HttpClient);
    // Use environment apiUrl directly, it already contains the base path
    private readonly baseUrl = environment.apiUrl || 'http://localhost:8080';

    /**
     * Get list of followers for a user
     */
    getFollowers(userId: string): Observable<UserCard[]> {
        return this.http.get<UserCard[]>(`${this.baseUrl}/follows/followers/${userId}`);
    }

    /**
     * Get list of users that a user is following
     */
    getFollowing(userId: string): Observable<UserCard[]> {
        return this.http.get<UserCard[]>(`${this.baseUrl}/follows/following/${userId}`);
    }

    /**
     * Follow a user
     */
    follow(followerId: string, targetId: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/follows/${targetId}?followerId=${followerId}`,
            {}
        );
    }

    /**
     * Unfollow a user
     */
    unfollow(followerId: string, targetId: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.baseUrl}/follows/${targetId}?followerId=${followerId}`
        );
    }

    /**
     * Check follow status
     */
    getFollowStatus(followerId: string, targetId: string): Observable<{ isFollowing: boolean }> {
        return this.http.get<{ isFollowing: boolean }>(
            `${this.baseUrl}/follows/status/${targetId}?followerId=${followerId}`
        );
    }

    /**
     * Get suggested users to follow (excluding self and already following)
     */
    getSuggestions(userId: string): Observable<UserCard[]> {
        return this.http.get<UserCard[]>(`${this.baseUrl}/follows/suggestions/${userId}`);
    }
}
