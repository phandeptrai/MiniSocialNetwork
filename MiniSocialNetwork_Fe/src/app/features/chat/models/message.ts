export interface Attachment {
  id?: string;
  fileName: string;
  objectKey: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string; // Presigned URL
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'ATTACHMENT';
  attachments: Attachment[];
  isDeleted: boolean;
  createdAt: string; // ISO Date String

  // -- Client-side only properties --
  isSender?: boolean;
  status?: 'sending' | 'sent' | 'error';
  tempId?: string; // Temporary ID for optimistic UI
}