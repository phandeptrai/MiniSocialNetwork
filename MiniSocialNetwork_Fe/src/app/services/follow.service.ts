import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FollowStatus {
    isFollowing: boolean;
}

export interface FollowResponse {
    message: string;
    followerId?: number;
    followingId?: number;
    createdAt?: string;
}

export interface CountResponse {
    count: number;
}

@Injectable({
    providedIn: 'root'
})
export class FollowService {
    private readonly apiUrl = 'http://localhost:8080/api/follows';

    constructor(private http: HttpClient) { }

    /**
     * Follow a user
     * @param followingId - ID of the user to follow
     * @param followerId - ID of the current user (follower)
     */
    followUser(followingId: number, followerId: number): Observable<FollowResponse> {
        return this.http.post<FollowResponse>(
            `${this.apiUrl}/${followingId}?followerId=${followerId}`,
            {}
        );
    }

    /**
     * Unfollow a user
     * @param followingId - ID of the user to unfollow
     * @param followerId - ID of the current user
     */
    unfollowUser(followingId: number, followerId: number): Observable<FollowResponse> {
        return this.http.delete<FollowResponse>(
            `${this.apiUrl}/${followingId}?followerId=${followerId}`
        );
    }

    /**
     * Get follow status between two users
     * @param followingId - ID of the target user
     * @param followerId - ID of the current user
     */
    getFollowStatus(followingId: number, followerId: number): Observable<FollowStatus> {
        return this.http.get<FollowStatus>(
            `${this.apiUrl}/status/${followingId}?followerId=${followerId}`
        );
    }

    /**
     * Get followers count for a user
     */
    getFollowersCount(userId: number): Observable<CountResponse> {
        return this.http.get<CountResponse>(`${this.apiUrl}/followers/count/${userId}`);
    }

    /**
     * Get following count for a user
     */
    getFollowingCount(userId: number): Observable<CountResponse> {
        return this.http.get<CountResponse>(`${this.apiUrl}/following/count/${userId}`);
    }
}
