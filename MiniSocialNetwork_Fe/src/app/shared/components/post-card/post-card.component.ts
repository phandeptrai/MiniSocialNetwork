import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { PostViewModel } from '../../models/post.model';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
})
export class PostCardComponent {
  @Input() post!: PostViewModel;
  @Input() isLiked = false;

  @Output() like = new EventEmitter<void>();
  @Output() comment = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  readonly commentCtrl = this.fb.control('');
  readonly internalLikeCount = signal(0);
  readonly internalIsLiked = signal(false);

  readonly imageCount = computed(() => this.post?.imageUrls?.length ?? 0);

  ngOnChanges(): void {
    this.internalLikeCount.set(this.post?.likeCount ?? 0);
    this.internalIsLiked.set(this.isLiked);
  }

  onToggleLike(): void {
    this.internalIsLiked.update((v) => !v);
    this.internalLikeCount.update((c) => c + (this.internalIsLiked() ? 1 : -1));
    this.like.emit();
  }

  onSubmitComment(): void {
    const content = (this.commentCtrl.value || '').trim();
    if (!content) return;
    this.comment.emit(content);
    this.commentCtrl.reset();
  }
}


