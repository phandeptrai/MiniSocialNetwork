/**
 * Interface đại diện cho một notification.
 */
export interface Notification {
  id: string;
  receiverId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
  postId?: string;
  conversationId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Response từ API pagination cho notifications.
 */
export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Response cho unread count.
 */
export interface UnreadCountResponse {
  count: number;
}
