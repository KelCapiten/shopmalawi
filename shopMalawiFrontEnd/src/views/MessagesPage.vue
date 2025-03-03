<template>
  <ion-page>
    <appHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content :fullscreen="true">
      <div
        class="messages-container"
        :class="{ 'showing-messages': isMobileAndShowingMessages }"
      >
        <!-- Conversations List -->
        <div class="conversations-list">
          <div class="conversations-header">
            <h2>Messages</h2>
          </div>
          <div v-if="loading" class="loading-state">
            <ion-spinner></ion-spinner>
          </div>
          <div v-else-if="conversations.length === 0" class="empty-state">
            No conversations yet
          </div>
          <ion-list v-else>
            <ion-item
              v-for="conv in conversations"
              :key="conv.id"
              :class="{ selected: selectedConversation?.id === conv.id }"
              @click="selectConversation(conv)"
              button
            >
              <ion-avatar slot="start">
                <img
                  :src="conv.otherUser.avatar || '/default-avatar.png'"
                  :alt="conv.otherUser.name || conv.otherUser.username"
                />
              </ion-avatar>
              <ion-label>
                <h3>{{ conv.otherUser.name || conv.otherUser.username }}</h3>
                <p class="last-message">{{ conv.lastMessage?.text }}</p>
              </ion-label>
              <ion-note slot="end">{{
                formatTime(conv.lastMessage?.timestamp)
              }}</ion-note>
            </ion-item>
          </ion-list>
        </div>

        <!-- Message Details -->
        <div class="message-details" v-if="selectedConversation">
          <div class="message-header">
            <ion-button v-if="isMobile" fill="clear" @click="goBackToList">
              <ion-icon :icon="arrowBack" />
            </ion-button>
            <ion-avatar>
              <img
                :src="
                  selectedConversation.otherUser.avatar || '/default-avatar.png'
                "
                :alt="selectedConversation.otherUser.name"
              />
            </ion-avatar>
            <h3>{{ selectedConversation.otherUser.name }}</h3>
          </div>

          <div class="messages-list" ref="messagesList">
            <div v-if="loadingMessages" class="loading-messages">
              <ion-spinner />
            </div>
            <div v-else>
              <div
                v-for="message in selectedConversation.messages"
                :key="message.id"
                :class="['message', message.isOwn ? 'own' : 'other']"
              >
                <div class="message-bubble">
                  {{ message.text }}
                  <div class="message-time">
                    {{ formatTime(message.timestamp) }}
                    <ion-icon
                      v-if="message.isOwn"
                      :icon="checkmarkDone"
                      class="message-status"
                      :class="{ read: message.isRead }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="message-input">
            <ion-item>
              <ion-input
                v-model="newMessage"
                placeholder="Type a message..."
                @keyup.enter="sendMessage"
              ></ion-input>
              <ion-button fill="clear" @click="sendMessage">
                <ion-icon :icon="sendOutline"></ion-icon>
              </ion-button>
            </ion-item>
          </div>
        </div>

        <div v-else class="no-conversation-selected">
          <ion-icon :icon="chatboxOutline" size="large"></ion-icon>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";
import { useMessagesStore } from "@/stores/messagesStore";
import {
  chatboxOutline,
  sendOutline,
  checkmarkDone,
  arrowBack,
} from "ionicons/icons";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import type { Conversation } from "@/types/types";

export default defineComponent({
  name: "MessagesPage",
  components: {
    appHeader,
    appFooter,
  },
  setup() {
    const store = useMessagesStore();
    const newMessage = ref<string>("");
    const messagesList = ref<HTMLElement | null>(null);
    const isMobile = ref(window.innerWidth <= 768);
    const isMobileAndShowingMessages = ref(false);
    const loadingMessages = ref(false);

    onMounted(async () => {
      await store.fetchConversations();

      // If there's a selected conversation, reload it
      if (store.selectedConversation) {
        await store.selectConversation(store.selectedConversation.id);
      }

      window.addEventListener("resize", updateIsMobile);
    });

    const updateIsMobile = () => {
      isMobile.value = window.innerWidth <= 768;
    };

    const scrollToBottom = () => {
      if (messagesList.value) {
        setTimeout(() => {
          messagesList.value!.scrollTop = messagesList.value!.scrollHeight;
        }, 100);
      }
    };

    const selectConversation = async (conv: Conversation): Promise<void> => {
      loadingMessages.value = true;

      try {
        await store.selectConversation(conv.id);
        await store.markAsRead(conv.id);

        // Set mobile view state after conversation is loaded
        if (isMobile.value) {
          isMobileAndShowingMessages.value = true;
        }

        scrollToBottom();
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        loadingMessages.value = false;
      }
    };

    const goBackToList = () => {
      isMobileAndShowingMessages.value = false;
    };

    const sendMessage = async (): Promise<void> => {
      if (!newMessage.value.trim()) return;

      if (await store.sendMessage(newMessage.value)) {
        newMessage.value = "";
        scrollToBottom();
      }
    };

    const formatTime = (timestamp: Date | undefined): string => {
      if (!timestamp) return "";

      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      // If less than 24 hours ago, show time
      if (diffHours < 24) {
        if (diffMins < 60) {
          return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
      }

      // If less than 7 days ago, show day
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }

      // Otherwise show date
      return date.toLocaleDateString();
    };

    // Watch for new messages and scroll to bottom
    watch(
      () => store.selectedConversation,
      (newConv) => {
        if (newConv) {
          scrollToBottom();
        }
      },
      { immediate: true }
    );

    watch(
      () => store.selectedConversation?.messages,
      (newMessages) => {
        if (newMessages) {
          scrollToBottom();
        }
      },
      { deep: true }
    );

    // Add watch for conversation changes
    watch(
      () => store.conversations,
      () => {
        if (store.selectedConversation) {
          scrollToBottom();
        }
      },
      { deep: true }
    );

    // Update watchers to be more specific
    watch(
      () => store.selectedConversationId,
      (newId) => {
        if (newId) {
          const conv = store.conversations.find((c) => c.id === newId);
          if (conv && conv.messages) {
            scrollToBottom();
          }
        }
      }
    );

    return {
      loading: store.loading,
      loadingMessages,
      conversations: computed(() => store.sortedConversations),
      selectedConversation: computed(() => store.selectedConversation),
      newMessage,
      messagesList,
      isMobile,
      isMobileAndShowingMessages,
      selectConversation,
      sendMessage,
      formatTime,
      goBackToList,
      chatboxOutline,
      sendOutline,
      checkmarkDone,
      arrowBack,
    };
  },
});
</script>

<style scoped>
.messages-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(
    100vh - 112px
  ); /* Adjusted to account for header (56px) and footer (56px) */
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.conversations-list {
  border-right: 1px solid #ddd;
  background: white;
}

.conversations-header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.message-details {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.message-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.message-header ion-avatar {
  margin-right: 1rem;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin: 8px 0;
  display: flex;
}

.message.own {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f0f0f0;
}

.message.own .message-bubble {
  background: #0074d9;
  color: white;
}

.message-time {
  font-size: 0.8em;
  opacity: 0.7;
  margin-top: 4px;
}

.message-input {
  border-top: 1px solid #ddd;
  padding: 8px;
}

.no-conversation-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.loading-state,
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.loading-messages {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-status {
  font-size: 14px;
  margin-left: 4px;
  color: #97989d;
}

.message-status.read {
  color: #0074d9;
}

.message-header ion-button {
  margin-right: 8px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .messages-container {
    display: block;
    height: calc(100vh - 112px); /* Adjusted to account for header and footer */
    position: relative;
    overflow: hidden;
  }

  .conversations-list,
  .message-details {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease-in-out;
    background: white;
  }

  .conversations-list {
    transform: translateX(0);
    z-index: 1;
  }

  .message-details {
    transform: translateX(100%);
    z-index: 2;
  }

  .showing-messages .conversations-list {
    transform: translateX(-100%);
  }

  .showing-messages .message-details {
    transform: translateX(0);
  }

  .message-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 3;
    display: flex;
    align-items: center;
    padding: 0.5rem;
  }

  .message-input {
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 3;
    padding: 0.5rem;
  }

  .messages-list {
    height: calc(100% - 130px); /* Increased to provide more space for input */
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 2rem; /* Added extra padding at bottom */
  }
}

@media (max-width: 480px) {
  .messages-container {
    height: calc(100vh - 112px); /* Keep consistent with other breakpoints */
  }

  .message-bubble {
    max-width: 90%;
    font-size: 0.95em;
  }

  .message-header h3 {
    font-size: 1rem;
  }

  .conversations-header h2 {
    font-size: 1.2rem;
  }
}
</style>
