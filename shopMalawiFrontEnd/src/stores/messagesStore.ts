import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Conversation, Message } from "@/types/types";
import axios from "axios";
import { mockConversations } from "@/mocks/messagesMock";

// Add this constant to control mock data usage
const USE_MOCK_DATA = process.env.NODE_ENV === "development";

export const useMessagesStore = defineStore("messages", () => {
  const conversations = ref<Conversation[]>([]);
  const selectedConversationId = ref<number | null>(null);
  const loading = ref(false);

  // Initialize from localStorage
  const initializeFromStorage = () => {
    const stored = localStorage.getItem("conversations");
    if (stored) {
      conversations.value = JSON.parse(stored).map((conv: any) => ({
        ...conv,
        lastMessage: conv.lastMessage
          ? {
              ...conv.lastMessage,
              timestamp: new Date(conv.lastMessage.timestamp),
            }
          : null,
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    }
    const storedId = localStorage.getItem("selectedConversationId");
    if (storedId) {
      selectedConversationId.value = parseInt(storedId);
    }
  };

  // Save to localStorage
  const saveToStorage = () => {
    localStorage.setItem("conversations", JSON.stringify(conversations.value));
    if (selectedConversationId.value) {
      localStorage.setItem(
        "selectedConversationId",
        selectedConversationId.value.toString()
      );
    }
  };

  // Computed property for sorted conversations
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      const timeA = a.lastMessage?.timestamp?.getTime() || 0;
      const timeB = b.lastMessage?.timestamp?.getTime() || 0;
      return timeB - timeA;
    });
  });

  // Computed property for selected conversation
  const selectedConversation = computed(() =>
    conversations.value.find((conv) => conv.id === selectedConversationId.value)
  );

  // Fetch all conversations
  const fetchConversations = async () => {
    loading.value = true;
    try {
      if (USE_MOCK_DATA) {
        // Deep clone the mock conversations
        conversations.value = mockConversations.map((conv) => ({
          ...JSON.parse(JSON.stringify(conv)),
          messages: conv.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(
              msg.timestamp instanceof Date
                ? msg.timestamp.getTime()
                : msg.timestamp
            ),
          })),
          lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                timestamp: new Date(
                  conv.lastMessage.timestamp instanceof Date
                    ? conv.lastMessage.timestamp.getTime()
                    : conv.lastMessage.timestamp
                ),
              }
            : null,
        }));
      } else {
        const response = await axios.get("/api/messages/conversations");
        conversations.value = response.data.map((conv: any) => ({
          ...conv,
          messages: conv.messages || [],
          lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                timestamp: new Date(conv.lastMessage.timestamp),
              }
            : null,
        }));
      }
      saveToStorage();
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Fallback to stored conversations if API fails
      initializeFromStorage();
    } finally {
      loading.value = false;
    }
  };

  // Select and load conversation messages
  const selectConversation = async (conversationId: number) => {
    try {
      selectedConversationId.value = conversationId;

      if (USE_MOCK_DATA) {
        // Find the exact conversation from the original mock data
        const originalMockConv = mockConversations.find(
          (c) => c.id === conversationId
        );
        if (!originalMockConv) return;

        // Deep clone the conversation with its messages
        const clonedConv = {
          ...JSON.parse(JSON.stringify(originalMockConv)),
          messages: originalMockConv.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(
              msg.timestamp instanceof Date
                ? msg.timestamp.getTime()
                : msg.timestamp
            ),
          })),
        };

        // Update the specific conversation in the store
        const index = conversations.value.findIndex(
          (c) => c.id === conversationId
        );
        if (index !== -1) {
          conversations.value = [
            ...conversations.value.slice(0, index),
            clonedConv,
            ...conversations.value.slice(index + 1),
          ];
        } else {
          conversations.value = [...conversations.value, clonedConv];
        }
      } else {
        const response = await axios.get(
          `/api/messages/conversations/${conversationId}`
        );
        // Update the messages for this conversation
        const index = conversations.value.findIndex(
          (c) => c.id === conversationId
        );
        if (index !== -1) {
          const updatedConversation = {
            ...conversations.value[index],
            messages: response.data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          };

          // Force reactivity by creating a new array
          conversations.value = [
            ...conversations.value.slice(0, index),
            updatedConversation,
            ...conversations.value.slice(index + 1),
          ];

          saveToStorage();
        }
      }
      saveToStorage();
    } catch (error) {
      console.error("Error in selectConversation:", error);
    }
  };

  // Send a new message
  const sendMessage = async (text: string): Promise<boolean> => {
    if (!selectedConversationId.value) return false;

    try {
      if (USE_MOCK_DATA) {
        // Simulate sending a message
        const newMessage = {
          id: Date.now(),
          text,
          timestamp: new Date(),
          isOwn: true,
          sender_id: 1, // Assuming current user id is 1
          receiver_id: 2,
          isRead: false,
        };

        const conversation = conversations.value.find(
          (c) => c.id === selectedConversationId.value
        );
        if (conversation) {
          conversation.messages.push(newMessage);
          conversation.lastMessage = newMessage;
          saveToStorage();
        }
        return true;
      } else {
        const response = await axios.post(`/api/messages/send`, {
          conversationId: selectedConversationId.value,
          text,
        });

        // Add the new message to the conversation
        const conversation = conversations.value.find(
          (c) => c.id === selectedConversationId.value
        );
        if (conversation) {
          conversation.messages.push({
            ...response.data,
            timestamp: new Date(response.data.timestamp),
          });
          conversation.lastMessage = {
            ...response.data,
            timestamp: new Date(response.data.timestamp),
          };
        }
        return true;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: number) => {
    try {
      await axios.post(`/api/messages/mark-read/${conversationId}`);
      const conversation = conversations.value.find(
        (c) => c.id === conversationId
      );
      if (conversation) {
        conversation.messages.forEach((msg) => {
          if (!msg.isOwn) {
            msg.isRead = true;
          }
        });
      }
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  // Add this getter
  const getSelectedId = computed(() => selectedConversationId.value);

  // Initialize store
  initializeFromStorage();

  return {
    conversations,
    loading,
    selectedConversation,
    sortedConversations,
    fetchConversations,
    selectConversation,
    sendMessage,
    markAsRead,
    selectedConversationId: getSelectedId,
    setSelectedConversationId: (id: number) =>
      (selectedConversationId.value = id),
  };
});
