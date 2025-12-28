import { Component, OnInit, signal, inject, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PeopleService, UserCard } from './people.service';
import { KeycloakApiService } from '../auth/services/keycloak-api.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-people-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
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

    // Search and Filter
    searchQuery = signal('');
    filterMode = signal<'all' | 'following' | 'not-following'>('all');

    // Computed filtered lists
    filteredFollowers = computed(() => this.applySearchFilter(this.followers()));
    filteredFollowing = computed(() => this.applySearchFilter(this.following()));
    filteredSuggestions = computed(() => this.applySearchFilter(this.suggestions()));

    // Combined list for filter tabs
    allUsers = computed(() => {
        const all: UserCard[] = [];
        const seenIds = new Set<string>();

        // Add followers
        for (const user of this.followers()) {
            if (!seenIds.has(user.id)) {
                seenIds.add(user.id);
                all.push(user);
            }
        }
        // Add following
        for (const user of this.following()) {
            if (!seenIds.has(user.id)) {
                seenIds.add(user.id);
                all.push(user);
            }
        }
        // Add suggestions
        for (const user of this.suggestions()) {
            if (!seenIds.has(user.id)) {
                seenIds.add(user.id);
                all.push(user);
            }
        }
        return all;
    });

    // Filtered results based on search and filter mode
    filteredResults = computed(() => {
        let users = this.allUsers();

        // Apply filter mode
        // 'following' = Đã follow = users where isFollowing is true
        // 'not-following' = Chưa follow = users where isFollowing is false
        if (this.filterMode() === 'following') {
            // Đã follow: lấy từ danh sách following (những người mình đang follow)
            users = this.following();
        } else if (this.filterMode() === 'not-following') {
            // Chưa follow: lấy từ danh sách suggestions (những người mình chưa follow)
            users = this.suggestions();
        }

        // Apply search
        return this.applySearchFilter(users);
    });

    private currentUserId: string | null = null;

    ngOnInit(): void {
        // Skip auth operations during SSR
        if (!isPlatformBrowser(this.platformId)) {
            console.log('SSR detected, skipping data load');
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
                this.suggestions.set([]);
            }
        } else {
            console.warn('User not authenticated - no token found');
            this.error.set('Please login to view your followers and following');
            this.suggestions.set([]);
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
                    this.suggestions.set([]);
                }
            });
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

    scrollContainer(containerType: 'followers' | 'following' | 'suggestions' | 'filtered', scrollAmount: number): void {
        const container = document.getElementById(`${containerType}-container`);
        if (container) {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    openChat(user: UserCard): void {
        console.log('Opening chat with:', user);

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

    // Search and Filter Methods
    private applySearchFilter(users: UserCard[]): UserCard[] {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) {
            return users;
        }
        return users.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        );
    }

    onSearchChange(query: string): void {
        this.searchQuery.set(query);
    }

    setFilterMode(mode: 'all' | 'following' | 'not-following'): void {
        this.filterMode.set(mode);
    }

    toggleFollowInResults(user: UserCard): void {
        if (!this.currentUserId) {
            console.error('No current user ID available');
            return;
        }

        this.isLoading.set(true);
        const wasFollowing = user.isFollowing;

        // Optimistic update
        user.isFollowing = !user.isFollowing;

        const action$ = wasFollowing
            ? this.peopleService.unfollow(this.currentUserId, user.id)
            : this.peopleService.follow(this.currentUserId, user.id);

        action$
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    console.log('Follow action successful:', response);
                    // Refresh all data to ensure consistency
                    this.loadFollowers();
                    this.loadFollowing();
                    this.loadSuggestions();
                },
                error: (err) => {
                    console.error('Error toggling follow:', err);
                    // Revert optimistic update on error
                    user.isFollowing = wasFollowing;
                    this.error.set('Failed to update follow status');
                }
            });
    }
}
