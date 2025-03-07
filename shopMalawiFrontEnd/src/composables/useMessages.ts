// src/composables/useMessages.ts
import { ref } from "vue";
import type {
  CreateConversationPayload,
  CreateConversationResponse,
  GetConversationsResponse,
} from "@/types/messagesTypes";
import {
  createConversation,
  getConversationsList,
} from "@/services/messagesService";

export function useMessages() {
  const conversations = ref<GetConversationsResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch conversations from the backend
  async function fetchConversationsList(params?: {
    page?: number;
    limit?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getConversationsList(params);
      conversations.value = response;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch conversations";
    } finally {
      loading.value = false;
    }
  }

  // Create a new conversation with the given payload
  async function createNewConversation(
    payload: CreateConversationPayload
  ): Promise<CreateConversationResponse | null> {
    loading.value = true;
    error.value = null;
    try {
      const response = await createConversation(payload);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to create conversation";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    conversations,
    loading,
    error,
    createNewConversation,
    fetchConversationsList,
  };
}
