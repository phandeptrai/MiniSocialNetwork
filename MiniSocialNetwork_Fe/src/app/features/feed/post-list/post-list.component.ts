import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { CommentPopupComponent } from '../comment-popup/comment-popup.component';
import { PostViewModel } from '../models/post.model';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';
import { FeedSocketService } from '../services/feed-socket.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CommentPopupComponent],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.css',
})
export class PostListComponent implements OnInit, OnDestroy {
  @Input() currentUserId!: string;

  private readonly keycloakApi = inject(KeycloakApiService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly feedSocketService = inject(FeedSocketService);

  private readonly posts = signal<PostViewModel[]>([]);
  readonly postsVm = computed(() => this.posts());
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Comment popup
  readonly selectedPostForComments = signal<PostViewModel | null>(null);
  readonly isCommentPopupOpen = computed(() => this.selectedPostForComments() !== null);

  private _currentUserName = '';
  get currentUserName(): string {
    return this._currentUserName;
  }

  // Pagination
  private currentPage = 0;
  private readonly pageSize = 10;
  private hasMorePosts = true;
  private totalElements = 0;

  // WebSocket subscription
  private feedSubscription?: Subscription;

  // Cache user info để tránh gọi API trùng lặp
  private userCache = new Map<string, UserProfile>();

  ngOnInit(): void {
    this.loadCurrentUserInfo();
    this.loadPosts();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.feedSubscription?.unsubscribe();
    this.feedSocketService.disconnect();
  }

  /**
   * Kết nối WebSocket để nhận bài viết mới real-time
   */
  private connectWebSocket(): void {
    this.feedSocketService.connect();

    this.feedSubscription = this.feedSocketService.newPost$.subscribe(post => {
      console.log('📬 Received new post via WebSocket:', post);

      // Kiểm tra xem bài viết đã tồn tại trong danh sách chưa
      const existingPost = this.posts().find(p => p.id === post.id);
      if (!existingPost) {
        // Fetch user info và thêm vào đầu danh sách
        this.fetchUserAndPrependPost(post);
      }
    });
  }

  /**
   * Xử lý bài viết nhận từ WebSocket: Fetch user info -> Map -> Prepend
   */
  private fetchUserAndPrependPost(post: PostResponse): void {
    // Nếu đã có thông tin user trong cache
    if (this.userCache.has(post.authorId)) {
      const vm = this.mapToViewModel(post);
      this.posts.update(list => [vm, ...list]);
      this.totalElements++;
      console.log('✅ Added new post to top of feed (Cached User)');
      return;
    }

    // Nếu chưa có, gọi API lấy thông tin
    this.userService.getUserById(post.authorId).subscribe({
      next: (user) => {
        this.userCache.set(post.authorId, user);
        const vm = this.mapToViewModel(post);
        this.posts.update(list => [vm, ...list]);
        this.totalElements++;
        console.log('✅ Added new post to top of feed (Fetched User)');
      },
      error: (err) => {
        console.error('❌ Failed to fetch user info for new post:', err);
        // Fallback: Vẫn hiện post dù không lấy được user info
        const vm = this.mapToViewModel(post);
        this.posts.update(list => [vm, ...list]);
        this.totalElements++;
      }
    });
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
        this._currentUserName = claims.name || claims.preferred_username || '';
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
          this.loadUserInfoForPosts(posts, false);

          this.totalElements = response.totalElements || 0;
          this.hasMorePosts = !response.last && posts.length > 0;
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
          this.loadUserInfoForPosts(posts, true);

          this.hasMorePosts = !response.last && posts.length > 0;
        },
        error: (err) => {
          console.error('❌ Error loading more posts:', err);
          this.currentPage--; // Rollback page
          this.isLoadingMore.set(false);
        },
      });
  }

  /**
   * Load user info cho tất cả posts qua getUserById API
   */
  private loadUserInfoForPosts(posts: PostResponse[], append: boolean): void {
    if (!posts || posts.length === 0) {
      if (!append) {
        this.posts.set([]);
        this.isLoading.set(false);
      } else {
        this.isLoadingMore.set(false);
      }
      return;
    }

    // Lấy unique authorIds chưa có trong cache
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const uncachedAuthorIds = authorIds.filter(id => !this.userCache.has(id));

    // Nếu tất cả đã có trong cache, map trực tiếp
    if (uncachedAuthorIds.length === 0) {
      const viewModels = posts.map(p => this.mapToViewModel(p));
      if (append) {
        this.posts.update(list => [...list, ...viewModels]);
        this.isLoadingMore.set(false);
      } else {
        this.posts.set(viewModels);
        this.isLoading.set(false);
      }
      return;
    }

    // Gọi API để lấy thông tin user chưa có trong cache
    const userRequests = uncachedAuthorIds.map(authorId =>
      this.userService.getUserById(authorId).pipe(
        map(user => ({ authorId, user })),
        catchError(() => of({ authorId, user: null }))
      )
    );

    forkJoin(userRequests).subscribe({
      next: (results) => {
        // Lưu vào cache
        results.forEach(result => {
          if (result.user) {
            this.userCache.set(result.authorId, result.user);
          }
        });

        // Map posts với user info
        const viewModels = posts.map(p => this.mapToViewModel(p));

        if (append) {
          this.posts.update(list => [...list, ...viewModels]);
          this.isLoadingMore.set(false);
        } else {
          this.posts.set(viewModels);
          this.isLoading.set(false);
        }
      },
      error: () => {
        // Fallback: map posts mà không có user info
        const viewModels = posts.map(p => this.mapToViewModel(p));
        if (append) {
          this.posts.update(list => [...list, ...viewModels]);
          this.isLoadingMore.set(false);
        } else {
          this.posts.set(viewModels);
          this.isLoading.set(false);
        }
      }
    });
  }

  /**
   * Thêm post mới vào đầu danh sách (sau khi tạo thành công)
   */
  addNewPost(post: PostResponse, authorName: string): void {
    // Lưu current user info vào cache nếu chưa có
    if (!this.userCache.has(post.authorId)) {
      const userProfile: UserProfile = {
        id: post.authorId,
        username: this._currentUserName,
        email: '',
        name: authorName || this._currentUserName,
        bio: '',
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.userCache.set(post.authorId, userProfile);
    }

    const vm = this.mapToViewModel(post);
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
   * Lấy user info từ cache (đã load qua getUserById)
   */
  private mapToViewModel(post: PostResponse): PostViewModel {
    const cachedUser = this.userCache.get(post.authorId);

    // Nếu là bài viết của chính mình, dùng currentUserName
    const isOwnPost = post.authorId === this.currentUserId;
    const authorName = cachedUser?.name || cachedUser?.username || (isOwnPost ? this._currentUserName : '');
    const authorAvatarUrl = cachedUser?.avatarUrl || null;

    return {
      id: post.id,
      authorId: post.authorId,
      authorName: authorName,
      authorAvatarUrl: authorAvatarUrl,
      createdAt: post.createdAt,
      content: post.content,
      imageUrls: post.imageUrls ?? [],
      likeCount: post.likeCount,
      commentCount: post.commentCount,
    };
  }
}
