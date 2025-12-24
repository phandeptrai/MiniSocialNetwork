import { Component, Input, OnInit } from '@angular/core';
import { Message } from '../../models/message';
import { User } from '../../models/user';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-item',
  imports: [CommonModule],
  templateUrl: './message-item.html',
  styleUrl: './message-item.css',
})
export class MessageItem implements OnInit {
  @Input() message!: Message;

  // Không cần isSender ở input nữa vì chúng ta sẽ tự xác định
  currentUser: User | null = null;

  constructor(private chatState: ChatStateService, private chatSocket: ChatSocketService) { }

  ngOnInit(): void {
    this.currentUser = this.chatState.getCurrentUserValue();
    // Gán cờ isSender để template có thể sử dụng
    if (this.currentUser) {
      this.message.isSender = this.message.senderId === this.currentUser.id;
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
}
