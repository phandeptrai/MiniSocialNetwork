import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnInit,
    signal,
    inject,
    ElementRef,
    ViewChild
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostViewModel } from '../../../shared/models/post.model';
import { CommentService, CommentResponse, SliceResponse } from '../../../core/services/comment.service';

export interface CommentViewModel {
    id: string;
    userId: string;
    userName: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string;
}

@Component({
    selector: 'app-comment-popup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './comment-popup.component.html',
    styleUrl: './comment-popup.component.css',
})
export class CommentPopupComponent implements OnInit {
    @Input() post!: PostViewModel;
    @Input() currentUserId!: string;
    @Input() currentUserName: string = 'User';

    @Output() close = new EventEmitter<void>();
    @Output() commentAdded = new EventEmitter<void>();

    @ViewChild('commentsContainer') commentsContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('commentInput') commentInput!: ElementRef<HTMLTextAreaElement>;

    private readonly fb = inject(FormBuilder);
    private readonly commentService = inject(CommentService);

    readonly commentForm = this.fb.group({
        content: ['', [Validators.maxLength(500)]],
    });

    readonly comments = signal<CommentViewModel[]>([]);
    readonly isLoading = signal(false);
    readonly isLoadingMore = signal(false);
    readonly isSubmitting = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly validationError = signal<string | null>(null);

    private currentPage = 0;
    private readonly pageSize = 10;
    private hasMore = true;

    // Image upload
    selectedImage: File | null = null;
    imagePreviewUrl: string | null = null;

    ngOnInit(): void {
        this.loadComments();
    }

    /**
     * Load comments từ API (trang đầu tiên)
     */
    loadComments(): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.currentPage = 0;
        this.hasMore = true;

        this.commentService.getCommentsByPost(this.post.id, this.currentPage, this.pageSize)
            .subscribe({
                next: (response: SliceResponse<CommentResponse>) => {
                    console.log('📦 Comments loaded:', response);
                    const viewModels = response.content.map((c: CommentResponse) => this.mapToViewModel(c));
                    this.comments.set(viewModels);
                    this.hasMore = response.hasNext;
                    this.isLoading.set(false);
                },
                error: (err: unknown) => {
                    console.error('❌ Error loading comments:', err);
                    this.errorMessage.set('Không thể tải bình luận. Vui lòng thử lại.');
                    this.isLoading.set(false);
                },
            });
    }

    /**
     * Load thêm comments khi scroll
     */
    loadMoreComments(): void {
        if (this.isLoadingMore() || !this.hasMore) return;

        this.isLoadingMore.set(true);
        this.currentPage++;

        console.log(`📄 Loading page ${this.currentPage}...`);

        this.commentService.getCommentsByPost(this.post.id, this.currentPage, this.pageSize)
            .subscribe({
                next: (response: SliceResponse<CommentResponse>) => {
                    console.log(`📦 Page ${this.currentPage} loaded:`, response.content?.length, 'comments');

                    const viewModels = response.content.map((c: CommentResponse) => this.mapToViewModel(c));
                    this.comments.update(list => [...list, ...viewModels]);

                    this.hasMore = response.hasNext;
                    this.isLoadingMore.set(false);
                },
                error: (err: unknown) => {
                    console.error('❌ Error loading more comments:', err);
                    this.currentPage--; // Rollback page
                    this.isLoadingMore.set(false);
                },
            });
    }

    /**
     * Xử lý scroll event trong comments container
     */
    onScroll(event: Event): void {
        const element = event.target as HTMLElement;
        const scrollPosition = element.scrollTop + element.clientHeight;
        const scrollHeight = element.scrollHeight;
        const threshold = 100; // pixels from bottom

        if (scrollPosition >= scrollHeight - threshold) {
            this.loadMoreComments();
        }
    }

    /**
     * Submit comment mới
     */
    onSubmit(): void {
        this.validationError.set(null);

        const content = (this.commentForm.get('content')?.value || '').trim();
        const hasContent = content.length > 0;
        const hasImage = this.selectedImage !== null;

        // Validation
        if (!hasContent && !hasImage) {
            this.validationError.set('Vui lòng nhập nội dung hoặc chọn ảnh.');
            return;
        }

        if (content.length > 500) {
            this.validationError.set('Nội dung không được vượt quá 500 ký tự.');
            return;
        }

        if (!this.currentUserId) {
            this.validationError.set('Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        this.isSubmitting.set(true);

        this.commentService.createComment(
            this.post.id,
            this.currentUserId,
            hasContent ? content : null,
            this.selectedImage
        ).subscribe({
            next: (comment: CommentResponse) => {
                console.log('✅ Comment created:', comment);

                // Add new comment to the top of the list
                const newComment = this.mapToViewModel(comment);
                this.comments.update(list => [newComment, ...list]);

                // Reset form
                this.commentForm.reset();
                this.clearImage();
                this.isSubmitting.set(false);

                // Emit event to update post's comment count
                this.commentAdded.emit();
            },
            error: (err: unknown) => {
                console.error('❌ Error creating comment:', err);
                const errorMessage = (err as { error?: { message?: string } })?.error?.message || 'Không thể gửi bình luận. Vui lòng thử lại.';
                this.validationError.set(errorMessage);
                this.isSubmitting.set(false);
            },
        });
    }

    /**
     * Xử lý chọn ảnh
     */
    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.validationError.set('Vui lòng chọn file ảnh.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.validationError.set('Ảnh phải nhỏ hơn 5MB.');
            return;
        }

        this.validationError.set(null);
        this.selectedImage = file;

        // Create preview URL
        const reader = new FileReader();
        reader.onload = () => {
            this.imagePreviewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Xóa ảnh đã chọn
     */
    clearImage(): void {
        this.selectedImage = null;
        this.imagePreviewUrl = null;
    }

    /**
     * Đóng popup
     */
    onClose(): void {
        this.close.emit();
    }

    /**
     * Xử lý click vào overlay (đóng popup)
     */
    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
            this.onClose();
        }
    }

    /**
     * Xử lý phím Enter (không cần Shift)
     */
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.onSubmit();
        }
    }

    /**
     * Map CommentResponse sang CommentViewModel
     */
    private mapToViewModel(comment: CommentResponse): CommentViewModel {
        return {
            id: comment.id,
            userId: comment.userId,
            userName: comment.userId === this.currentUserId ? this.currentUserName : 'User',
            content: comment.content,
            imageUrl: comment.imageUrl,
            createdAt: comment.createdAt,
        };
    }

    /**
     * Kiểm tra xem có thể submit không
     */
    get canSubmit(): boolean {
        const content = (this.commentForm.get('content')?.value || '').trim();
        return (content.length > 0 || this.selectedImage !== null) && !this.isSubmitting();
    }

    /**
     * Đếm số ký tự đã nhập
     */
    get characterCount(): number {
        return (this.commentForm.get('content')?.value || '').length;
    }
}
