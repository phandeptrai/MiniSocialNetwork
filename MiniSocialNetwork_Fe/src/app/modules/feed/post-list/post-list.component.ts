import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { PostViewModel } from '../../../shared/models/post.model';
import { PostService, PostResponse } from '../../../core/services/post.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.css',
})
export class PostListComponent implements OnInit {
  @Input() currentUserId!: string;

  private readonly posts = signal<PostViewModel[]>([]);
  readonly postsVm = computed(() => this.posts());
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  /**
   * Load danh sách posts từ API
   * Tạm thời lấy posts của 1 author cố định
   */
  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Tạm thời dùng authorId cố định
    const authorId = '550e8400-e29b-41d4-a716-446655440000';

    // Component gọi Service để lấy dữ liệu
    // page=0 (bắt đầu từ page đầu tiên), size=100 (lấy tối đa 100 posts)
    this.postService
      .getPostsByAuthor(authorId, 0, 100)
      .subscribe({
        next: (response) => {
          // Xử lý dữ liệu từ PageResponse (Spring Boot pagination)
          console.log('📦 Response từ API:', response);
          console.log('📦 Total posts:', response.totalElements);
          console.log('📦 Current page:', response.number);
          console.log('📦 Total pages:', response.totalPages);
          
          const posts = response.content; // Lấy array từ content property
          const viewModels = posts.map(post => this.mapToViewModel(post));
          this.posts.set(viewModels);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Error loading posts:', err);
          console.error('❌ Error details:', err.status, err.message);
          this.errorMessage.set('Không thể tải bài viết. Vui lòng thử lại.');
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Thêm post mới vào đầu danh sách (sau khi tạo thành công)
   */
  addNewPost(post: PostResponse, authorName: string): void {
    const vm = this.mapToViewModel(post, authorName);
    this.posts.update((list) => [vm, ...list]);
  }

  /**
   * Xử lý like post
   */
  onLike(post: PostViewModel): void {
    if (!this.currentUserId) return;

    // Component gọi Service để toggle like
    this.postService
      .toggleLike(post.id, this.currentUserId)
      .subscribe({
        next: (updatedPost) => {
          // Cập nhật like count trong danh sách
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
   * Xử lý comment
   */
  onComment(post: PostViewModel, content: string): void {
    if (!this.currentUserId || !content.trim()) return;

    // Component gọi Service để thêm comment
    this.postService
      .addComment(post.id, this.currentUserId, content)
      .subscribe({
        next: () => {
          // Cập nhật comment count
          this.posts.update((list) =>
            list.map((p) =>
              p.id === post.id
                ? { ...p, commentCount: p.commentCount + 1 }
                : p
            )
          );
        },
        error: (err) => {
          console.error('Error adding comment:', err);
        },
      });
  }

  /**
   * Map PostResponse sang PostViewModel
   */
  private mapToViewModel(post: PostResponse, authorName?: string): PostViewModel {
    return {
      id: post.id,
      authorName: authorName || 'Unknown User', // TODO: lấy tên từ user service
      createdAt: post.createdAt,
      content: post.content,
      imageUrls: post.imageUrls ?? [],
      likeCount: post.likeCount,
      commentCount: post.commentCount,
    };
  }
}

