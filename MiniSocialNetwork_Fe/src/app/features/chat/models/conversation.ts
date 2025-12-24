import { Message } from "./message";

export interface Conversation {
  id: string;
  name: string | null;
  participantIds: string[];
  type: 'ONE_TO_ONE' | 'GROUP';
  createdBy: string;
  updatedAt: string; // ISO Date String
  createdAt: string; // ISO Date String
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageType: Message['messageType'] | null;
  
  // -- Client-side only properties --
  displayName?: string;
  displayAvatarUrl?: string;
}