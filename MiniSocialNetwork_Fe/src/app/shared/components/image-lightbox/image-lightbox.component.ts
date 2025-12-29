import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-image-lightbox',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="lightbox-overlay" *ngIf="isOpen" (click)="close()" [@fadeIn]>
      <!-- Close button -->
      <button class="close-btn" (click)="close()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Navigation buttons for multiple images -->
      <button class="nav-btn prev" *ngIf="images.length > 1" (click)="prevImage($event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <button class="nav-btn next" *ngIf="images.length > 1" (click)="nextImage($event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <!-- Image container -->
      <div class="image-container" (click)="$event.stopPropagation()">
        <img 
          [src]="images[currentIndex]" 
          [alt]="'Image ' + (currentIndex + 1)"
          class="lightbox-image"
          (load)="onImageLoad()"
          [class.loading]="isLoading"
        />
        
        <!-- Loading spinner -->
        <div class="loading-spinner" *ngIf="isLoading">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Image counter -->
      <div class="image-counter" *ngIf="images.length > 1">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>

      <!-- Thumbnail strip for multiple images -->
      <div class="thumbnail-strip" *ngIf="images.length > 1" (click)="$event.stopPropagation()">
        <div 
          class="thumbnail" 
          *ngFor="let img of images; let i = index"
          [class.active]="i === currentIndex"
          (click)="goToImage(i)"
        >
          <img [src]="img" [alt]="'Thumbnail ' + (i + 1)" />
        </div>
      </div>
    </div>
  `,
    styles: [`
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
      backdrop-filter: blur(8px);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10001;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .close-btn svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 52px;
      height: 52px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10001;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-btn.prev {
      left: 24px;
    }

    .nav-btn.next {
      right: 24px;
    }

    .nav-btn svg {
      width: 28px;
      height: 28px;
      color: white;
    }

    .image-container {
      position: relative;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-image {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .lightbox-image.loading {
      opacity: 0.3;
    }

    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .image-counter {
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .thumbnail-strip {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 12px;
      max-width: 90vw;
      overflow-x: auto;
    }

    .thumbnail {
      width: 56px;
      height: 56px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      opacity: 0.6;
    }

    .thumbnail:hover {
      opacity: 0.9;
    }

    .thumbnail.active {
      border-color: #1da1f2;
      opacity: 1;
    }

    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-btn {
        width: 44px;
        height: 44px;
      }

      .nav-btn.prev {
        left: 12px;
      }

      .nav-btn.next {
        right: 12px;
      }

      .nav-btn svg {
        width: 24px;
        height: 24px;
      }

      .close-btn {
        top: 12px;
        right: 12px;
        width: 40px;
        height: 40px;
      }

      .thumbnail {
        width: 48px;
        height: 48px;
      }

      .image-counter {
        bottom: 90px;
      }
    }
  `]
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
