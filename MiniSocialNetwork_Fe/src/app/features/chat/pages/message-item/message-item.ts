import { Component, Input, OnInit } from '@angular/core';
import { Message } from '../../models/message';
import { User } from '../../models/user';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user.service';
import { ImageLightboxComponent } from '../../../../shared/components/image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-message-item',
  imports: [CommonModule, ImageLightboxComponent],
  templateUrl: './message-item.html',
  styleUrl: './message-item.css',
})
export class MessageItem implements OnInit {
  @Input() message!: Message;

  // Không cần isSender ở input nữa vì chúng ta sẽ tự xác định
  currentUser: User | null = null;
  senderAvatarUrl: string | null = null;
  senderName: string | null = null;

  // Lightbox state
  isLightboxOpen = false;
  lightboxImages: string[] = [];
  lightboxStartIndex = 0;

  constructor(private chatState: ChatStateService, private chatSocket: ChatSocketService, private userService: UserService) { }

  ngOnInit(): void {
    this.currentUser = this.chatState.getCurrentUserValue();
    if (this.currentUser) {
      this.message.isSender = this.message.senderId === this.currentUser.id;
      this.userService.getUserById(this.message.senderId).subscribe({
        next: (user) => {
          this.senderAvatarUrl = user.avatarUrl || null;
          this.senderName = user.name || null;
        }
      });
    }
  }

  /**
   * Kiểm tra xem file đính kèm có phải là ảnh hay không.
   * @param fileType MIME type của file.
   * @returns boolean
   */
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.chatSocket.requestDeleteMessage(this.message.id);
    }
  }

  /**
   * Mở lightbox để xem hình ảnh phóng to
   */
  openLightbox(imageUrl: string): void {
    // Collect all image attachments from the message
    this.lightboxImages = (this.message.attachments
      ?.filter(att => this.isImage(att.fileType))
      .map(att => att.fileUrl)
      .filter((url): url is string => !!url)) || [];

    // Find the index of the clicked image
    this.lightboxStartIndex = this.lightboxImages.indexOf(imageUrl);
    if (this.lightboxStartIndex === -1) {
      this.lightboxStartIndex = 0;
    }

    this.isLightboxOpen = true;
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
  }
}

