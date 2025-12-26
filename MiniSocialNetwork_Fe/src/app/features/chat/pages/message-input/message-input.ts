import { Component, ViewChild, ElementRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { ChatApiService } from '../../services/chat-api.service';
import { ChatSocketService } from '../../services/chat-socket.service';
import { ChatStateService } from '../../services/chat-state.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.css',
})
export class MessageInputComponent {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;

  messageContent = '';
  selectedFiles: File[] = [];
  isUploading = false;

  constructor(
    private chatApi: ChatApiService,
    private chatSocket: ChatSocketService,
    private chatState: ChatStateService
  ) { }

  /**
   * Xử lý khi người dùng chọn file từ máy tính.
   */
  onFileSelected(event: any): void {
    const files = event.target.files as FileList;
    if (files) {
      // Giới hạn tổng số file không quá 5
      const totalFiles = this.selectedFiles.length + files.length;
      if (totalFiles > 5) {
        alert('You can only select up to 5 files.');
        return;
      }
      this.selectedFiles.push(...Array.from(files));
    }
    // Reset input để có thể chọn lại cùng một file
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  sendMessage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const content = this.messageContent.trim();
    if (!content && this.selectedFiles.length === 0) {
      return;
    }

    // Lấy pending recipient (nếu có)
    const pendingRecipient = this.chatState.getPendingRecipientValue();

    this.chatState.getSelectedConversation().pipe(take(1)).subscribe(conv => {
      // Ưu tiên conversation đang chọn
      if (conv) {
        if (this.selectedFiles.length > 0) {
          this.handleFileUploadAndSendMessage(conv.id, undefined, content);
        } else {
          this.sendTextMessage(conv.id, undefined, content);
        }
      }
      // Nếu không có conversation nhưng có pending recipient
      else if (pendingRecipient) {
        if (this.selectedFiles.length > 0) {
          this.handleFileUploadAndSendMessage(undefined, pendingRecipient.id, content);
        } else {
          this.sendTextMessage(undefined, pendingRecipient.id, content);
        }
      }
      else {
        alert("Please select a conversation to send a message.");
        return;
      }
    });
  }

  private handleFileUploadAndSendMessage(conversationId: string | undefined, recipientId: string | undefined, content: string): void {
    this.isUploading = true;

    // Upload file: nếu chưa có conversationId thì có thể cần gửi recipientId cho API upload (tùy backend support)
    // Hiện tại chat-api.service.ts hỗ trợ cả conversationId và recipientId
    this.chatApi.uploadAttachments(this.selectedFiles, conversationId, recipientId).subscribe({
      next: (uploadedAttachments) => {
        const payload: any = {
          content: content,
          attachments: uploadedAttachments.map(att => ({
            objectKey: att.objectKey,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize
          }))
        };

        if (conversationId) payload.conversationId = conversationId;
        if (recipientId) payload.recipientId = recipientId;

        this.chatSocket.sendMessage(payload);

        // Reset form
        this.isUploading = false;
        this.messageContent = '';
        this.selectedFiles = [];
        this.resetTextareaSize();
      },
      error: (err) => {
        console.error("File upload failed:", err);
        alert("An error occurred while uploading files. Please try again.");
        this.isUploading = false;
      }
    });
  }

  private sendTextMessage(conversationId: string | undefined, recipientId: string | undefined, content: string): void {
    const payload: any = { content: content };

    if (conversationId) payload.conversationId = conversationId;
    if (recipientId) payload.recipientId = recipientId;

    this.chatSocket.sendMessage(payload);
    this.messageContent = '';
    this.resetTextareaSize();
  }

  autoResize(event: any): void {
    const textArea = event.target;
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }

  private resetTextareaSize(): void {
    if (this.messageTextarea?.nativeElement) {
      this.messageTextarea.nativeElement.style.height = 'auto';
    }
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}