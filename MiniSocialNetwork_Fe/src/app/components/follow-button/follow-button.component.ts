import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FollowService, FollowStatus } from '../../services/follow.service';

@Component({
    selector: 'app-follow-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './follow-button.component.html',
    styleUrl: './follow-button.component.css'
})
export class FollowButtonComponent implements OnInit {
    /**
     * ID of the target user (the user being followed/unfollowed)
     */
    @Input({ required: true }) userId!: number;

    /**
     * ID of the current logged-in user
     * In a real app, this would come from an auth service
     */
    @Input({ required: true }) currentUserId!: number;

    protected isFollowing = signal(false);
    protected isLoading = signal(false);

    constructor(private followService: FollowService) { }

    ngOnInit(): void {
        this.checkFollowStatus();
    }

    /**
     * Check initial follow status
     */
    private checkFollowStatus(): void {
        if (this.userId === this.currentUserId) {
            return; // Can't follow yourself
        }

        this.isLoading.set(true);
        this.followService.getFollowStatus(this.userId, this.currentUserId).subscribe({
            next: (response: FollowStatus) => {
                this.isFollowing.set(response.isFollowing);
                this.isLoading.set(false);
            },
            error: (error: Error) => {
                console.error('Error checking follow status:', error);
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Toggle follow/unfollow status
     */
    toggleFollow(): void {
        if (this.isLoading()) {
            return;
        }

        this.isLoading.set(true);

        if (this.isFollowing()) {
            // Unfollow
            this.followService.unfollowUser(this.userId, this.currentUserId).subscribe({
                next: () => {
                    this.isFollowing.set(false);
                    this.isLoading.set(false);
                },
                error: (error: Error) => {
                    console.error('Error unfollowing user:', error);
                    this.isLoading.set(false);
                }
            });
        } else {
            // Follow
            this.followService.followUser(this.userId, this.currentUserId).subscribe({
                next: () => {
                    this.isFollowing.set(true);
                    this.isLoading.set(false);
                },
                error: (error: Error) => {
                    console.error('Error following user:', error);
                    this.isLoading.set(false);
                }
            });
        }
    }
}
