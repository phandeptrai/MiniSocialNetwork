import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakApiService } from '../../../auth/services/keycloak-api.service';
import { PostService, PostResponse } from '../../../../core/services/post.service';
import { PostCardComponent } from '../../../../shared/components/post-card/post-card.component';
import { UserService, UserProfile as DbUserProfile } from '../../../../core/services/user.service';
import { EditProfilePopupComponent } from '../../components/edit-profile-popup/edit-profile-popup.component';

interface UserProfile {
    id: string;
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
    imports: [CommonModule, PostCardComponent, EditProfilePopupComponent],
    templateUrl: './profile-page.component.html',
    styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
    private readonly keycloakApi = inject(KeycloakApiService);
    private readonly postService = inject(PostService);
    private readonly userService = inject(UserService);

    readonly isLoading = signal(true);
    readonly showEditPopup = signal(false);
    readonly dbProfile = signal<DbUserProfile | null>(null);

    readonly userProfile = signal<UserProfile>({
        id: '',
        name: '',
        username: '',
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
        // First get basic info from token
        const token = this.keycloakApi.getAccessToken();
        if (token) {
            const claims = this.keycloakApi.parseToken(token);
            if (claims) {
                this.userId = claims.sub;
                // Set initial values from token
                this.userProfile.set({
                    id: claims.sub,
                    name: claims.name || claims.preferred_username || '',
                    username: claims.preferred_username || '',
                    bio: '',
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(claims.name || claims.preferred_username || 'U')}&background=667eea&color=fff&size=128`,
                    postCount: 0,
                    followerCount: 0,
                    followingCount: 0,
                });

                // Then fetch profile from database (creates if not exists)
                // This call is fire-and-forget, errors won't block the page
                this.userService.getMyProfile().subscribe({
                    next: (profile) => {
                        console.log('📦 User profile from DB:', profile);
                        this.dbProfile.set(profile);
                        this.userProfile.update(p => ({
                            ...p,
                            name: profile.name || p.name,
                            bio: profile.bio || '',
                            avatarUrl: profile.avatarUrl || p.avatarUrl,
                        }));
                    },
                    error: (err) => {
                        // Don't redirect on error, just log it
                        console.warn('⚠️ Could not load profile from DB (this is ok):', err.status);
                    }
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
        this.showEditPopup.set(true);
    }

    onCloseEditPopup(): void {
        this.showEditPopup.set(false);
    }

    onProfileSaved(updatedProfile: DbUserProfile): void {
        console.log('✅ Profile updated:', updatedProfile);
        this.dbProfile.set(updatedProfile);
        this.userProfile.update(p => ({
            ...p,
            name: updatedProfile.name || p.name,
            bio: updatedProfile.bio || '',
            avatarUrl: updatedProfile.avatarUrl || p.avatarUrl,
        }));
        this.showEditPopup.set(false);
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

