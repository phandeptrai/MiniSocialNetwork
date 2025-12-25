import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { KeycloakApiService } from '../../auth/services/keycloak-api.service';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.css',
})
export class PostComposerComponent implements OnInit {
  @Input() currentUserName = 'User';
  @Input() currentUserAvatarUrl: string | null = null;

  @Output() postCreated = new EventEmitter<PostResponse>();

  private readonly keycloakApi = inject(KeycloakApiService);

  form: FormGroup;
  contentCtrl: FormControl<string | null>;

  selectedImages: File[] = [];
  imagePreviews: string[] = [];

  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  // Signal để track content changes
  private readonly contentSignal = signal<string>('');
  private readonly imagesSignal = signal<number>(0);

  private readonly MAX_IMAGES = 4;
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  readonly canSubmit = computed(() => {
    const notSubmitting = !this.isSubmitting();
    const content = this.contentSignal().trim();
    const imageCount = this.imagesSignal();
    const hasContent = content.length > 0 || imageCount > 0;

    console.log('🔍 canSubmit:', {
      notSubmitting,
      hasContent,
      contentLength: content.length,
      imageCount
    });

    return notSubmitting && hasContent;
  });

  constructor(
    private fb: FormBuilder,
    private postService: PostService
  ) {
    this.contentCtrl = this.fb.control<string | null>('');
    this.form = this.fb.group({
      content: this.contentCtrl,
    });

    // Subscribe to FormControl changes và update signal
    this.contentCtrl.valueChanges.subscribe(value => {
      this.contentSignal.set(value || '');
    });
  }

  ngOnInit(): void {
    // Lấy tên user từ JWT token
    const token = this.keycloakApi.getAccessToken();
    if (token) {
      const claims = this.keycloakApi.parseToken(token);
      if (claims) {
        this.currentUserName = claims.name || claims.preferred_username || 'User';
      }
    }
  }

  hasContentOrImages(): boolean {
    const content = (this.contentCtrl.value || '').trim();
    return content.length > 0 || this.selectedImages.length > 0;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);

    // Check if adding these files would exceed the limit
    if (this.selectedImages.length + files.length > this.MAX_IMAGES) {
      this.errorMessage.set(`Bạn chỉ có thể tải lên tối đa ${this.MAX_IMAGES} ảnh.`);
      return;
    }

    // Validate and add each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Chỉ chấp nhận file ảnh.');
        continue;
      }

      if (file.size > this.MAX_IMAGE_SIZE) {
        this.errorMessage.set('Kích thước ảnh không được vượt quá 5MB.');
        continue;
      }

      this.selectedImages.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
        // Update signal để trigger canSubmit
        this.imagesSignal.set(this.selectedImages.length);
      };
      reader.readAsDataURL(file);
    }

    // Reset the input
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    this.errorMessage.set(null);
    // Update signal để trigger canSubmit
    this.imagesSignal.set(this.selectedImages.length);
  }

  submit(): void {
    this.errorMessage.set(null);

    if (!this.hasContentOrImages()) {
      this.errorMessage.set('Bài viết phải có nội dung hoặc ít nhất 1 ảnh.');
      return;
    }

    this.isSubmitting.set(true);

    const content = this.contentCtrl.value?.trim() || null;

    // Component gọi Service để tạo post mới (backend lấy userId từ JWT)
    this.postService
      .createPost(content, this.selectedImages)
      .subscribe({
        next: (post) => {
          // Xử lý khi tạo post thành công
          this.isSubmitting.set(false);
          this.form.reset();
          this.selectedImages = [];
          this.imagePreviews = [];
          this.contentSignal.set('');
          this.imagesSignal.set(0);
          this.postCreated.emit(post);
        },
        error: () => {
          // Xử lý khi có lỗi
          this.isSubmitting.set(false);
          this.errorMessage.set('Đăng bài thất bại. Vui lòng thử lại.');
        },
      });
  }
}

