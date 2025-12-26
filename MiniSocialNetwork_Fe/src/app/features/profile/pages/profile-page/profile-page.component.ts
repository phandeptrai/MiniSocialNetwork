import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakApiService } from '../../../auth/services/keycloak-api.service';
import { PostService, PostResponse } from '../../../../core/services/post.service';
import { PostCardComponent } from '../../../../shared/components/post-card/post-card.component';

interface UserProfile {
    name: string;
    username: string;
    bio: string;
    avatarUrl: string;
    postCount: number;
    followerCount: number;
    followingCount: number;
}

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, PostCardComponent],
    templateUrl: './profile-page.component.html',
    styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
    private readonly keycloakApi = inject(KeycloakApiService);
    private readonly postService = inject(PostService);

    readonly isLoading = signal(true);
    readonly userProfile = signal<UserProfile>({
        name: 'User',
        username: 'user',
        bio: '',
        avatarUrl: '',
        postCount: 0,
        followerCount: 0,
        followingCount: 0,
    });

    readonly posts = signal<PostResponse[]>([]);
    private userId = '';

    ngOnInit(): void {
        this.loadUserProfile();
        this.loadUserPosts();
    }

    private loadUserProfile(): void {
        const token = this.keycloakApi.getAccessToken();
        if (token) {
            const claims = this.keycloakApi.parseToken(token);
            if (claims) {
                this.userId = claims.sub;
                this.userProfile.set({
                    name: claims.name || claims.preferred_username || 'User',
                    username: claims.preferred_username || 'user',
                    bio: 'Tech enthusiast and coffee lover.',
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(claims.name || 'User')}&background=667eea&color=fff&size=128`,
                    postCount: 0,
                    followerCount: 2,
                    followingCount: 2,
                });
            }
        }
    }

    private loadUserPosts(): void {
        if (!this.userId) {
            const token = this.keycloakApi.getAccessToken();
            if (token) {
                const claims = this.keycloakApi.parseToken(token);
                if (claims) this.userId = claims.sub;
            }
        }

        if (this.userId) {
            // Lấy tất cả posts của user (tối đa 1000)
            this.postService.getPostsByAuthor(this.userId, 0, 1000).subscribe({
                next: (response) => {
                    console.log('📦 Profile posts:', response);
                    this.posts.set(response.content || []);
                    this.userProfile.update(profile => ({
                        ...profile,
                        postCount: response.totalElements || response.content?.length || 0
                    }));
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('❌ Error loading posts:', err);
                    this.isLoading.set(false);
                }
            });
        } else {
            this.isLoading.set(false);
        }
    }

    onEditProfile(): void {
        // TODO: Open edit profile modal
        console.log('Edit profile clicked');
    }

    onLike(post: PostResponse): void {
        this.postService.toggleLike(post.id).subscribe({
            next: (updatedPost) => {
                this.posts.update(list =>
                    list.map(p => p.id === post.id ? { ...p, likeCount: updatedPost.likeCount } : p)
                );
            }
        });
    }
}
