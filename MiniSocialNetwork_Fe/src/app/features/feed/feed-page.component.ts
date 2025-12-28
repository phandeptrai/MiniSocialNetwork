import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { PostComposerComponent } from './post-composer/post-composer.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostResponse } from '../../core/services/post.service';
import { KeycloakApiService } from '../auth/services/keycloak-api.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, PostComposerComponent, PostListComponent],
  template: `
    <div class="feed-container">
      <!-- Post Composer - Tạo bài viết mới -->
      <app-post-composer
        [currentUserName]="currentUserName"
        (postCreated)="onPostCreated($event)"
      ></app-post-composer>

      <!-- Post List - Danh sách bài viết -->
      <section class="feed-list">
        <app-post-list
          [currentUserId]="currentUserId"
        ></app-post-list>
      </section>
    </div>
  `,
  styles: [
    `
      .feed-container {
        max-width: 700px;
        margin: 24px auto;
        padding: 0 16px;
      }

      .feed-list {
        margin-top: 16px;
      }
    `,
  ],
})
export class FeedPageComponent implements OnInit {
  private readonly keycloakApi = inject(KeycloakApiService);

  currentUserId = '';
  currentUserName = '';

  @ViewChild(PostListComponent) postListComponent!: PostListComponent;

  ngOnInit(): void {
    this.loadCurrentUserInfo();
  }

  /**
   * Lấy thông tin user từ JWT token
   */
  private loadCurrentUserInfo(): void {
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        this.currentUserId = claims.sub || '';
        this.currentUserName = claims.name || claims.preferred_username || '';
      }
    }
  }

  /**
   * Xử lý khi tạo post thành công
   * Thêm post mới vào đầu danh sách
   */
  onPostCreated(post: PostResponse): void {
    if (this.postListComponent) {
      this.postListComponent.addNewPost(post, this.currentUserName);
    }
  }
}
