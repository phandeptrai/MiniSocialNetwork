import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostViewModel } from '../../models/post.model';
import { ImageLightboxComponent } from '../image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageLightboxComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
})
export class PostCardComponent implements OnChanges {
  @Input() post!: PostViewModel;
  @Input() isLiked = false;
  @Input() currentUserId = '';

  @Output() like = new EventEmitter<void>();
  @Output() openComments = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();

  readonly internalLikeCount = signal(0);
  readonly internalIsLiked = signal(false);
  readonly internalCommentCount = signal(0);

  // Menu and edit state
  readonly isMenuOpen = signal(false);
  readonly isEditing = signal(false);
  editedContent = '';

  readonly imageCount = computed(() => this.post?.imageUrls?.length ?? 0);
  readonly isOwner = computed(() => this.currentUserId && this.post?.authorId === this.currentUserId);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post'] && this.post) {
      this.internalLikeCount.set(this.post.likeCount ?? 0);
      this.internalCommentCount.set(this.post.commentCount ?? 0);
      this.editedContent = this.post.content || '';
    }
    if (changes['isLiked']) {
      this.internalIsLiked.set(this.isLiked);
    }
  }

  onToggleLike(): void {
    this.like.emit();
  }

  onOpenComments(): void {
    this.openComments.emit();
  }

  // Menu actions
  toggleMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  // Edit actions
  startEdit(): void {
    this.editedContent = this.post.content || '';
    this.isEditing.set(true);
    this.closeMenu();
  }

  cancelEdit(): void {
    this.editedContent = this.post.content || '';
    this.isEditing.set(false);
  }

  saveEdit(): void {
    if (this.editedContent.trim()) {
      this.edit.emit(this.editedContent.trim());
      this.isEditing.set(false);
    }
  }

  // Delete action
  confirmDelete(): void {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      this.delete.emit();
    }
    this.closeMenu();
  }

  // Lightbox state
  readonly isLightboxOpen = signal(false);
  lightboxStartIndex = 0;

  openLightbox(index: number): void {
    this.lightboxStartIndex = index;
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }
}
