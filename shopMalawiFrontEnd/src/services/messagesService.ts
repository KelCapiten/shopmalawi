// src/services/messagesService.ts
import apiClient from "./apiClient";
import type {
  CreateConversationPayload,
  CreateConversationResponse,
  GetConversationsResponse,
} from "@/types/messagesTypes";

// Create a new conversation
export async function createConversation(
  payload: CreateConversationPayload
): Promise<CreateConversationResponse> {
  const response = await apiClient.post<CreateConversationResponse>(
    "/api/messages/createConversation",
    payload
  );
  return response.data;
}

// Get all conversations for the authenticated user
export async function getConversationsList(params?: {
  page?: number;
  limit?: number;
}): Promise<GetConversationsResponse> {
  const response = await apiClient.get<GetConversationsResponse>(
    "/api/messages/getConversationsList",
    { params }
  );
  return response.data;
}
