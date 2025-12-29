import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-lightbox.component.html',
  styleUrl: './image-lightbox.component.css'
})
export class ImageLightboxComponent {
  @Input() images: string[] = [];
  @Input() isOpen = false;
  @Input() startIndex = 0;
  @Output() closed = new EventEmitter<void>();

  currentIndex = 0;
  isLoading = true;

  ngOnChanges(): void {
    if (this.isOpen) {
      this.currentIndex = this.startIndex;
      this.isLoading = true;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prevImage(event);
        break;
      case 'ArrowRight':
        this.nextImage(event);
        break;
    }
  }

  close(): void {
    document.body.style.overflow = '';
    this.closed.emit();
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.currentIndex = this.currentIndex > 0
      ? this.currentIndex - 1
      : this.images.length - 1;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.currentIndex = this.currentIndex < this.images.length - 1
      ? this.currentIndex + 1
      : 0;
  }

  goToImage(index: number): void {
    if (index !== this.currentIndex) {
      this.isLoading = true;
      this.currentIndex = index;
    }
  }

  onImageLoad(): void {
    this.isLoading = false;
  }
}
