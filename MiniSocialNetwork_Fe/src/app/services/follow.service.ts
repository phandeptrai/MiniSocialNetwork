import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FollowService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/follows';

    /**
     * Follow a user
     */
    follow(followerId: number, targetId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.apiUrl}/${targetId}?followerId=${followerId}`,
            {}
        );
    }

    /**
     * Unfollow a user
     */
    unfollow(followerId: number, targetId: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.apiUrl}/${targetId}?followerId=${followerId}`
        );
    }

    /**
     * Check if user is following another user
     */
    getFollowStatus(followerId: number, targetId: number): Observable<{ isFollowing: boolean }> {
        return this.http.get<{ isFollowing: boolean }>(
            `${this.apiUrl}/status/${targetId}?followerId=${followerId}`
        );
    }

    /**
     * Get follower count
     */
    getFollowerCount(userId: number): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(
            `${this.apiUrl}/count/followers/${userId}`
        );
    }

    /**
     * Get following count
     */
    getFollowingCount(userId: number): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(
            `${this.apiUrl}/count/following/${userId}`
        );
    }
}
