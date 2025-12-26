import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { PostComposerComponent } from './post-composer/post-composer.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostResponse } from '../../core/services/post.service';

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
export class FeedPageComponent {
  // Tạm hard-code user info cho demo; sau này lấy từ AuthService
  readonly currentUserId = '550e8400-e29b-41d4-a716-446655440000';
  readonly currentUserName = 'John Doe';

  @ViewChild(PostListComponent) postListComponent!: PostListComponent;

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


