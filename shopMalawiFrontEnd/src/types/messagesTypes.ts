// =====================
// src/types/messagesTypes.ts
// =====================

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  text: string;
  parent_message_id?: number | null;
  delivery_status: "sent" | "delivered" | "failed";
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  is_read?: boolean;
  has_attachments?: boolean;
  attachment_id?: number;
  file_type?: string;
  file_path?: string;
  file_name?: string;
  reactions?: Reaction[];
  read_receipts?: ReadReceipt[];
  forwarded_from?: number;
}

export interface Reaction {
  id: number;
  user_id: number;
  reaction_type: string;
}

export interface ReadReceipt {
  user_id: number;
  read_at: string;
}

export interface CreateMessagePayload {
  conversationId: number;
  text: string;
  parentMessageId?: number | null;
}

export interface EditMessagePayload {
  messageId: number;
  text: string;
}

export interface DeleteMessagePayload {
  messageId: number;
}

export interface UpdateDeliveryStatusPayload {
  messageId: number;
  status: "delivered" | "failed";
}

export interface ForwardMessagePayload {
  messageId: number;
  conversationIds: number[];
}

export interface BulkMarkAsReadPayload {
  messageIds: number[];
}

export interface GetMessagesResponse {
  messages: Message[];
  cursor: {
    next: number | null;
    prev: number | null;
  };
}

// =====================
// Conversation Interfaces
// =====================

export interface CreateConversationPayload {
  participantIds: number[];
  initialMessage?: string;
  title?: string;
  description?: string;
  isGroup?: boolean;
}

export interface CreateConversationResponse {
  id: number;
}

export interface ConversationMetadata {
  title?: string;
  description?: string;
  is_group: boolean;
  avatar_url?: string;
  created_by?: number;
}

export interface Participant {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  status: "online" | "offline" | string;
  last_active: string | null;
  joined_at: string;
  last_read_at: string | null;
  profile_picture_url?: string | null;
}

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string | null;
  last_message_id: number | null;
  title?: string;
  description?: string;
  is_group: boolean;
  avatar_url?: string;
  created_by?: number;
  unread_count: number;
  last_message: Message | null;
  last_activity: string | null;
  message_count: number;
  current_user_last_read: string | null;
  current_user_joined_at: string;
  participants: Participant[];
  is_one_on_one: boolean;
  other_participant: Participant | null;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type GetConversationResponse = Message[];

// =====================
// Additional Interfaces
// =====================

export interface Sender {
  id: number;
  username: string;
  avatar: string;
}

export interface MessageWithSender extends Message {
  sender: Sender;
}
