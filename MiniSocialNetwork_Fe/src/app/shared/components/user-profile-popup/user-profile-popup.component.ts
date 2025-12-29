import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { FollowService } from '../../../services/follow.service';
import { PostService } from '../../../core/services/post.service';

@Component({
    selector: 'app-user-profile-popup',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-profile-popup.component.html',
    styleUrl: './user-profile-popup.component.css'
})
export class UserProfilePopupComponent implements OnChanges {
    @Input() userId: string = '';
    @Input() currentUserId: string = '';
    @Input() isOpen: boolean = false;
    @Output() closed = new EventEmitter<void>();

    private readonly userService = inject(UserService);
    private readonly followService = inject(FollowService);
    private readonly postService = inject(PostService);

    readonly loading = signal(false);
    readonly user = signal<UserProfile | null>(null);
    readonly isFollowing = signal(false);
    readonly followLoading = signal(false);
    readonly postCount = signal(0);
    readonly followerCount = signal(0);
    readonly followingCount = signal(0);

    readonly isOwnProfile = signal(false);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen && this.userId) {
            this.loadUserProfile();
        }
        if (changes['userId'] || changes['currentUserId']) {
            this.isOwnProfile.set(this.userId === this.currentUserId);
        }
    }

    private loadUserProfile(): void {
        this.loading.set(true);
        this.user.set(null);

        // Load user profile
        this.userService.getUserById(this.userId).subscribe({
            next: (profile) => {
                this.user.set(profile);
                this.loading.set(false);
                this.loadStats();
                if (!this.isOwnProfile()) {
                    this.loadFollowStatus();
                }
            },
            error: (err) => {
                console.error('Failed to load user profile:', err);
                this.loading.set(false);
            }
        });
    }

    private loadStats(): void {
        // Load post count using getPostsByAuthor
        this.postService.getPostsByAuthor(this.userId).subscribe({
            next: (response) => {
                this.postCount.set(response.totalElements || response.content?.length || 0);
            },
            error: () => this.postCount.set(0)
        });

        // Load follower count
        this.followService.getFollowerCount(this.userId as any).subscribe({
            next: (res) => this.followerCount.set(res.count),
            error: () => this.followerCount.set(0)
        });

        // Load following count
        this.followService.getFollowingCount(this.userId as any).subscribe({
            next: (res) => this.followingCount.set(res.count),
            error: () => this.followingCount.set(0)
        });
    }

    private loadFollowStatus(): void {
        this.followService.getFollowStatus(this.currentUserId as any, this.userId as any).subscribe({
            next: (res) => this.isFollowing.set(res.isFollowing),
            error: () => this.isFollowing.set(false)
        });
    }

    toggleFollow(): void {
        if (this.followLoading()) return;

        this.followLoading.set(true);
        const currentStatus = this.isFollowing();

        if (currentStatus) {
            this.followService.unfollow(this.currentUserId as any, this.userId as any).subscribe({
                next: () => {
                    this.isFollowing.set(false);
                    this.followerCount.update(c => Math.max(0, c - 1));
                    this.followLoading.set(false);
                },
                error: () => this.followLoading.set(false)
            });
        } else {
            this.followService.follow(this.currentUserId as any, this.userId as any).subscribe({
                next: () => {
                    this.isFollowing.set(true);
                    this.followerCount.update(c => c + 1);
                    this.followLoading.set(false);
                },
                error: () => this.followLoading.set(false)
            });
        }
    }

    close(): void {
        this.closed.emit();
    }

    onOverlayClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }
}
