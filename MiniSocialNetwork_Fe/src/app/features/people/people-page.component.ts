import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PeopleService, UserCard } from './people.service';
import { KeycloakApiService } from '../auth/services/keycloak-api.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-people-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './people-page.component.html',
    styleUrls: ['./people-page.component.css']
})
export class PeoplePageComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly peopleService = inject(PeopleService);
    private readonly keycloakApi = inject(KeycloakApiService);
    private readonly platformId = inject(PLATFORM_ID);

    followers = signal<UserCard[]>([]);
    following = signal<UserCard[]>([]);
    suggestions = signal<UserCard[]>([]);
    isLoading = signal(false);
    isFollowersLoading = signal(false);
    isFollowingLoading = signal(false);
    error = signal<string | null>(null);

    private currentUserId: string | null = null;

    ngOnInit(): void {
        // Skip auth operations during SSR
        if (!isPlatformBrowser(this.platformId)) {
            console.log('SSR detected, loading mock data');
            this.loadSuggestionsMock();
            return;
        }

        // Browser context - load user info from JWT token
        this.loadCurrentUserInfo();
    }

    /**
     * Lấy thông tin user từ JWT token (giống như Feed page)
     */
    private loadCurrentUserInfo(): void {
        const token = this.keycloakApi.getAccessToken();
        if (token) {
            const claims = this.keycloakApi.parseToken(token);
            if (claims) {
                this.currentUserId = claims.sub;
                console.log('Current User ID:', this.currentUserId);

                // Load all data from API
                this.loadFollowers();
                this.loadFollowing();
                this.loadSuggestions();
            } else {
                console.warn('Could not parse token claims');
                this.error.set('Please login to view your followers and following');
                this.loadSuggestionsMock(); // Fallback to mock
            }
        } else {
            console.warn('User not authenticated - no token found');
            this.error.set('Please login to view your followers and following');
            this.loadSuggestionsMock(); // Fallback to mock
        }
    }

    private loadFollowers(): void {
        if (!this.currentUserId) return;

        this.isFollowersLoading.set(true);
        this.error.set(null);

        this.peopleService.getFollowers(this.currentUserId)
            .pipe(finalize(() => this.isFollowersLoading.set(false)))
            .subscribe({
                next: (data) => {
                    console.log('Followers loaded:', data);
                    this.followers.set(data);
                },
                error: (err) => {
                    console.error('Error loading followers:', err);
                    this.error.set('Failed to load followers');
                    this.followers.set([]);
                }
            });
    }

    private loadFollowing(): void {
        if (!this.currentUserId) return;

        this.isFollowingLoading.set(true);
        this.error.set(null);

        this.peopleService.getFollowing(this.currentUserId)
            .pipe(finalize(() => this.isFollowingLoading.set(false)))
            .subscribe({
                next: (data) => {
                    console.log('Following loaded:', data);
                    this.following.set(data);
                },
                error: (err) => {
                    console.error('Error loading following:', err);
                    this.error.set('Failed to load following');
                    this.following.set([]);
                }
            });
    }

    private loadSuggestions(): void {
        if (!this.currentUserId) return;

        this.peopleService.getSuggestions(this.currentUserId)
            .subscribe({
                next: (data) => {
                    console.log('Suggestions loaded:', data);
                    this.suggestions.set(data);
                },
                error: (err) => {
                    console.error('Error loading suggestions:', err);
                    // Fallback to mock data on error
                    this.loadSuggestionsMock();
                }
            });
    }

    private loadSuggestionsMock(): void {
        // Mock suggestions as fallback
        this.suggestions.set([
            {
                id: '6',
                name: 'Charlie Brown',
                username: '@charlie_brown',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                bio: 'Artist and dreamer. Painting life in bright colors.',
                followersCount: 1,
                followingCount: 3,
                isFollowing: false,
                followsYou: true
            },
            {
                id: '7',
                name: 'David King',
                username: '@david_king',
                avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
                bio: 'Fitness coach and wellness advocate.',
                followersCount: 15,
                followingCount: 8,
                isFollowing: false
            },
            {
                id: '8',
                name: 'Emma Watson',
                username: '@emma_watson',
                avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                bio: 'Bibliophile and nature enthusiast.',
                followersCount: 42,
                followingCount: 12,
                isFollowing: false,
                followsYou: true
            },
            {
                id: '9',
                name: 'Frank Ocean',
                username: '@frank_ocean',
                avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
                bio: 'Tech enthusiast | Gamer',
                followersCount: 120,
                followingCount: 50,
                isFollowing: false
            }
        ]);
    }

    toggleFollow(user: UserCard, list: 'followers' | 'following' | 'suggestions'): void {
        if (!this.currentUserId) {
            console.error('No current user ID available');
            return;
        }

        this.isLoading.set(true);
        const wasFollowing = user.isFollowing;

        // Optimistic update
        user.isFollowing = !user.isFollowing;
        this.updateList(list);

        const action$ = wasFollowing
            ? this.peopleService.unfollow(this.currentUserId, user.id)
            : this.peopleService.follow(this.currentUserId, user.id);

        action$
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    console.log('Follow action successful:', response);

                    // Refresh data to ensure consistency
                    if (list === 'followers' || list === 'following') {
                        this.loadFollowers();
                        this.loadFollowing();
                    }
                },
                error: (err) => {
                    console.error('Error toggling follow:', err);
                    // Revert optimistic update on error
                    user.isFollowing = wasFollowing;
                    this.updateList(list);
                    this.error.set('Failed to update follow status');
                }
            });
    }

    private updateList(list: 'followers' | 'following' | 'suggestions'): void {
        if (list === 'followers') {
            this.followers.set([...this.followers()]);
        } else if (list === 'following') {
            this.following.set([...this.following()]);
        } else {
            this.suggestions.set([...this.suggestions()]);
        }
    }

    scrollContainer(containerType: 'followers' | 'following' | 'suggestions', scrollAmount: number): void {
        const container = document.getElementById(`${containerType}-container`);
        if (container) {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    openChat(user: UserCard): void {
        console.log('Opening chat with:', user);
        if (user.id.length < 10) {
            console.warn('WARNING: User ID seems to be MOCK DATA. Chat will likely fail.');
            alert('Cannot chat with this user (Mock Data).');
            return;
        }

        this.router.navigate(['/chat'], {
            queryParams: {
                recipientId: user.id,
                recipientName: user.name,
                recipientAvatar: user.avatarUrl
            }
        });
    }

    refresh(): void {
        this.loadCurrentUserInfo();
    }
}
