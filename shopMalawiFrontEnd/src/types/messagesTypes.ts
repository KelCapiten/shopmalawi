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
  created_at: Date;
  edited_at?: Date;
  deleted_at?: Date;
  is_read?: boolean;
  // Optionally, you might include attachment info if applicable
  attachment_id?: number;
  file_type?: string;
  file_path?: string;
  file_name?: string;
  // For reactions and read receipts, you could add:
  reactions?: Reaction[];
  read_receipts?: ReadReceipt[];
  // For forwarded messages, include the original message id if applicable
  forwarded_from?: number;
}

export interface Reaction {
  id: number;
  user_id: number;
  reaction_type: string;
}

export interface ReadReceipt {
  user_id: number;
  read_at: Date;
}

// Payload for creating a new message
export interface CreateMessagePayload {
  conversationId: number;
  text: string;
  parentMessageId?: number | null;
  // files will be handled separately if applicable
}

// Payload for editing a message
export interface EditMessagePayload {
  messageId: number;
  text: string;
}

// Payload for deleting a message (soft delete)
export interface DeleteMessagePayload {
  messageId: number;
}

// Payload for updating message delivery status
export interface UpdateDeliveryStatusPayload {
  messageId: number;
  status: "delivered" | "failed";
}

// Payload for forwarding a message
export interface ForwardMessagePayload {
  messageId: number;
  conversationIds: number[];
}

// Payload for bulk marking messages as read
export interface BulkMarkAsReadPayload {
  messageIds: number[];
}

// Response from fetching messages by cursor (pagination)
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

// Payload for creating a conversation
export interface CreateConversationPayload {
  participantIds: number[];
  initialMessage?: string;
  title?: string;
  description?: string;
  isGroup?: boolean;
}

// Response from creating a conversation
export interface CreateConversationResponse {
  id: number;
}

// Conversation metadata as stored in your conversation_metadata table
export interface ConversationMetadata {
  title?: string;
  description?: string;
  is_group: boolean;
  avatar_url?: string;
  // Additional metadata fields can be added as needed
}

// A summary of conversation details for listing conversations
export interface Conversation {
  id: number;
  // These fields may come from joining conversations with metadata
  title?: string;
  description?: string;
  is_group: boolean;
  avatar_url?: string;
  unread_count?: number;
  // The last message is returned as a JSON object in your query
  last_message: Message | null;
}

// Response from the getConversations endpoint
export interface GetConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// The getConversation endpoint returns an array of messages
export type GetConversationResponse = Message[];

// =====================
// Additional Interfaces
// =====================

// Optional: Define a Sender interface for messages that include sender details
export interface Sender {
  id: number;
  username: string;
  avatar: string;
}

// Extend Message with sender information (used in cursor pagination, etc.)
export interface MessageWithSender extends Message {
  sender: Sender;
}
