import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { CommentPopupComponent } from '../comment-popup/comment-popup.component';
import { PostViewModel } from '../../../shared/models/post.model';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CommentPopupComponent],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.css',
})
export class PostListComponent implements OnInit {
  @Input() currentUserId!: string;

  private readonly keycloakApi = inject(KeycloakApiService);
  private readonly postService = inject(PostService);

  private readonly posts = signal<PostViewModel[]>([]);
  readonly postsVm = computed(() => this.posts());
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Comment popup
  readonly selectedPostForComments = signal<PostViewModel | null>(null);
  readonly isCommentPopupOpen = computed(() => this.selectedPostForComments() !== null);

  private _currentUserName = 'User';
  get currentUserName(): string {
    return this._currentUserName;
  }

  // Pagination
  private currentPage = 0;
  private readonly pageSize = 10;
  private hasMorePosts = true;
  private totalElements = 0;

  ngOnInit(): void {
    this.loadCurrentUserInfo();
    this.loadPosts();
  }

  /**
   * Lấy thông tin user từ JWT token
   */
  private loadCurrentUserInfo(): void {
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        this.currentUserId = claims.sub;
        this._currentUserName = claims.name || claims.preferred_username || 'User';
      }
    }
  }

  /**
   * Kiểm tra scroll position và load thêm posts
   */
  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isLoadingMore() || !this.hasMorePosts) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = 200; // pixels from bottom

    if (scrollPosition >= documentHeight - threshold) {
      this.loadMorePosts();
    }
  }

  /**
   * Load danh sách posts từ Feed API (F1 + F2 + F3 extended following)
   */
  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentPage = 0;
    this.hasMorePosts = true;

    if (!this.currentUserId) {
      this.loadCurrentUserInfo();
    }

    this.postService
      .getFeed(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          console.log('📦 Initial feed posts loaded:', response);
          const posts = response.content || [];
          const viewModels = posts.map(post => this.mapToViewModel(post, this.currentUserName));
          this.posts.set(viewModels);

          this.totalElements = response.totalElements || 0;
          this.hasMorePosts = !response.last && posts.length > 0;
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Error loading feed:', err);
          this.errorMessage.set('Không thể tải bài viết. Vui lòng thử lại.');
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Load thêm posts (infinite scroll)
   */
  loadMorePosts(): void {
    if (this.isLoadingMore() || !this.hasMorePosts) return;

    this.isLoadingMore.set(true);
    this.currentPage++;

    console.log(`📄 Loading page ${this.currentPage}...`);

    this.postService
      .getFeed(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          console.log(`📦 Page ${this.currentPage} loaded:`, response.content?.length, 'posts');

          const posts = response.content || [];
          const viewModels = posts.map(post => this.mapToViewModel(post, this.currentUserName));

          // Thêm posts mới vào cuối danh sách
          this.posts.update(list => [...list, ...viewModels]);

          this.hasMorePosts = !response.last && posts.length > 0;
          this.isLoadingMore.set(false);
        },
        error: (err) => {
          console.error('❌ Error loading more posts:', err);
          this.currentPage--; // Rollback page
          this.isLoadingMore.set(false);
        },
      });
  }

  /**
   * Thêm post mới vào đầu danh sách (sau khi tạo thành công)
   */
  addNewPost(post: PostResponse, authorName: string): void {
    const vm = this.mapToViewModel(post, authorName || this.currentUserName);
    this.posts.update((list) => [vm, ...list]);
    this.totalElements++;
  }

  /**
   * Xử lý like post
   */
  onLike(post: PostViewModel): void {
    this.postService
      .toggleLike(post.id)
      .subscribe({
        next: (updatedPost) => {
          this.posts.update((list) =>
            list.map((p) =>
              p.id === post.id
                ? { ...p, likeCount: updatedPost.likeCount }
                : p
            )
          );
        },
        error: (err) => {
          console.error('Error toggling like:', err);
        },
      });
  }

  /**
   * Mở popup comments cho một post
   */
  openCommentPopup(post: PostViewModel): void {
    this.selectedPostForComments.set(post);
  }

  /**
   * Đóng popup comments
   */
  closeCommentPopup(): void {
    this.selectedPostForComments.set(null);
  }

  /**
   * Xử lý edit post
   */
  onEdit(post: PostViewModel, newContent: string): void {
    this.postService.updatePost(post.id, newContent).subscribe({
      next: (updatedPost) => {
        this.posts.update((list) =>
          list.map((p) =>
            p.id === post.id
              ? { ...p, content: updatedPost.content }
              : p
          )
        );
        console.log('✅ Post updated successfully');
      },
      error: (err) => {
        console.error('❌ Error updating post:', err);
        alert('Không thể cập nhật bài viết. Vui lòng thử lại.');
      },
    });
  }

  /**
   * Xử lý delete post
   */
  onDelete(post: PostViewModel): void {
    this.postService.deletePost(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        console.log('✅ Post deleted successfully');
      },
      error: (err) => {
        console.error('❌ Error deleting post:', err);
        alert('Không thể xóa bài viết. Vui lòng thử lại.');
      },
    });
  }

  /**
   * TrackBy function để ngăn Angular re-create component khi chỉ thay đổi like count
   */
  trackByPostId(index: number, post: PostViewModel): string {
    return post.id;
  }

  /**
   * Xử lý khi comment được thêm thành công
   */
  onCommentAdded(): void {
    const selectedPost = this.selectedPostForComments();
    if (selectedPost) {
      console.log('📝 onCommentAdded - Before update:', selectedPost.id, 'commentCount:', selectedPost.commentCount);

      this.posts.update((list) =>
        list.map((p) =>
          p.id === selectedPost.id
            ? { ...p, commentCount: p.commentCount + 1 }
            : p
        )
      );
      // Update selected post as well
      this.selectedPostForComments.update(post =>
        post ? { ...post, commentCount: post.commentCount + 1 } : null
      );

      console.log('📝 onCommentAdded - After update: commentCount:', selectedPost.commentCount + 1);
    }
  }

  /**
   * Map PostResponse sang PostViewModel
   */
  private mapToViewModel(post: PostResponse, fallbackAuthorName?: string): PostViewModel {
    // Chỉ dùng fallbackAuthorName nếu đây là bài viết của chính user hiện tại
    const isOwnPost = post.authorId === this.currentUserId;
    const authorName = post.authorName || (isOwnPost ? fallbackAuthorName : null) || 'User';

    return {
      id: post.id,
      authorId: post.authorId,
      authorName: authorName,
      authorAvatarUrl: post.authorAvatarUrl,
      createdAt: post.createdAt,
      content: post.content,
      imageUrls: post.imageUrls ?? [],
      likeCount: post.likeCount,
      commentCount: post.commentCount,
    };
  }
}
