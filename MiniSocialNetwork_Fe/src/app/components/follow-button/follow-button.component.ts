import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FollowService } from '../../services/follow.service';

@Component({
    selector: 'app-follow-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './follow-button.component.html',
    styleUrls: ['./follow-button.component.css']
})
export class FollowButtonComponent implements OnInit {
    @Input({ required: true }) targetUserId!: number;
    @Input({ required: true }) currentUserId!: number;

    private readonly followService = inject(FollowService);

    isFollowing = signal<boolean | null>(null);
    isLoading = signal(false);

    ngOnInit(): void {
        this.loadFollowStatus();
    }

    private loadFollowStatus(): void {
        this.isLoading.set(true);
        this.followService.getFollowStatus(this.currentUserId, this.targetUserId)
            .subscribe({
                next: (response) => {
                    this.isFollowing.set(response.isFollowing);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.isFollowing.set(false);
                    this.isLoading.set(false);
                }
            });
    }

    toggleFollow(): void {
        if (this.isLoading()) return;

        this.isLoading.set(true);
        const currentStatus = this.isFollowing();

        if (currentStatus) {
            this.followService.unfollow(this.currentUserId, this.targetUserId)
                .subscribe({
                    next: () => {
                        this.isFollowing.set(false);
                        this.isLoading.set(false);
                    },
                    error: () => {
                        this.isLoading.set(false);
                    }
                });
        } else {
            this.followService.follow(this.currentUserId, this.targetUserId)
                .subscribe({
                    next: () => {
                        this.isFollowing.set(true);
                        this.isLoading.set(false);
                    },
                    error: () => {
                        this.isLoading.set(false);
                    }
                });
        }
    }
}
