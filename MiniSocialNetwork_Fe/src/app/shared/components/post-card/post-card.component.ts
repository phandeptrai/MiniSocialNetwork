import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { PostViewModel } from '../../models/post.model';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
})
export class PostCardComponent implements OnChanges {
  @Input() post!: PostViewModel;
  @Input() isLiked = false;

  @Output() like = new EventEmitter<void>();
  @Output() openComments = new EventEmitter<void>();

  readonly internalLikeCount = signal(0);
  readonly internalIsLiked = signal(false);
  readonly internalCommentCount = signal(0);

  readonly imageCount = computed(() => this.post?.imageUrls?.length ?? 0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post'] && this.post) {
      this.internalLikeCount.set(this.post.likeCount ?? 0);
      this.internalCommentCount.set(this.post.commentCount ?? 0);
    }
    if (changes['isLiked']) {
      this.internalIsLiked.set(this.isLiked);
    }
  }

  onToggleLike(): void {
    this.internalIsLiked.update((v) => !v);
    this.internalLikeCount.update((c) => c + (this.internalIsLiked() ? 1 : -1));
    this.like.emit();
  }

  onOpenComments(): void {
    this.openComments.emit();
  }
}
