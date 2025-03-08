//src/views/MessagesPage.vue
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
              :class="{
                selected:
                  selectedConversation && selectedConversation.id === conv.id,
              }"
              @click="selectConversation(conv)"
            >
              <ion-avatar slot="start">
                <img
                  :src="conv.avatar_url || '/default-avatar.png'"
                  :alt="conv.title || 'Conversation'"
                />
              </ion-avatar>
              <ion-label>
                <h3>{{ conv.title || "Conversation" }}</h3>
                <p class="last-message">{{ conv.last_message?.text }}</p>
              </ion-label>
              <ion-note slot="end">{{
                formatTime(conv.last_message?.created_at)
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
                :src="selectedConversation.avatar_url || '/default-avatar.png'"
                :alt="selectedConversation.title || 'Conversation'"
              />
            </ion-avatar>
            <h3>{{ selectedConversation.title || "Conversation" }}</h3>
          </div>

          <div class="messages-list" ref="messagesList">
            <div v-if="loadingMessages" class="loading-messages">
              <ion-spinner />
            </div>
            <div
              v-else-if="selectedConversation.last_message"
              :key="selectedConversation.id"
            >
              <div :class="['message', 'own']">
                <div class="message-bubble">
                  {{ selectedConversation.last_message.text }}
                  <div class="message-time">
                    {{
                      formatTime(selectedConversation.last_message.created_at)
                    }}
                    <ion-icon
                      v-if="
                        selectedConversation.last_message.is_read !== undefined
                      "
                      :icon="checkmarkDone"
                      class="message-status"
                      :class="{
                        read: selectedConversation.last_message.is_read,
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else>No messages yet</div>
          </div>

          <div class="message-input">
            <ion-item>
              <ion-input
                v-model="newMessage"
                placeholder="Type a message..."
                @keyup.enter="sendMessage"
              >
              </ion-input>
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
import { useRoute } from "vue-router";
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  computed,
  nextTick,
} from "vue";
import { useMessagesStore } from "@/stores/messagesStore";
import {
  chatboxOutline,
  sendOutline,
  checkmarkDone,
  arrowBack,
} from "ionicons/icons";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import type { Conversation } from "@/types/messagesTypes";
import { useAuthStore } from "@/stores/authStore";

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
    // Make sure conversations is properly reactive
    const conversations = computed(() =>
      store.ConversationsList ? store.ConversationsList.conversations : []
    );
    // Make sure selectedConversation is properly reactive
    const selectedConversation = computed(() => store.selectedConversation);
    const route = useRoute();
    const authStore = useAuthStore();

    onMounted(async () => {
      store.initializeWebSocket();

      const chatWithThisID = route.query.sellerId
        ? Number(route.query.sellerId)
        : null;

      if (chatWithThisID === null) {
        // Just get conversations without dummy
        await store.getConversationsList();
      } else {
        //if chatWithThisID is the current user, just get their conversations
        if (authStore.user?.id === chatWithThisID) {
          await store.getConversationsList();
          return;
        }
        // Get conversations and add dummy
        await store.getConversationsList({ addDummy: true });

        // Find the dummy conversation in the list
        const dummyConv = conversations.value.find((conv) => conv.id === -1);
        if (dummyConv) {
          // Use selectConversation to trigger all UI updates
          selectConversation(dummyConv);
        }
      }

      console.log("Conversations loaded:", conversations.value);
      if (store.selectedConversation) {
        scrollToBottom();
      }
      window.addEventListener("resize", updateIsMobile);
    });

    const updateIsMobile = () => {
      isMobile.value = window.innerWidth <= 768;
    };

    const scrollToBottom = () => {
      if (messagesList.value) {
        nextTick(() => {
          messagesList.value!.scrollTop = messagesList.value!.scrollHeight;
        });
      }
    };

    const selectConversation = async (conv: Conversation): Promise<void> => {
      // Set the selected conversation ID in the store
      store.selectedConversationId = conv.id;

      // Force a UI refresh cycle
      nextTick(() => {
        if (isMobile.value) {
          isMobileAndShowingMessages.value = true;
        }
        // Make sure to scroll after the DOM has updated
        scrollToBottom();
      });
    };

    const goBackToList = () => {
      isMobileAndShowingMessages.value = false;
    };

    const sendMessage = async (): Promise<void> => {
      if (!newMessage.value.trim()) return;
      const success = await store.sendMessage(newMessage.value);
      if (success) {
        newMessage.value = "";
        scrollToBottom();
      }
    };

    const formatTime = (timestamp: Date | string | undefined): string => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);
      if (diffHours < 24) {
        if (diffMins < 60) {
          return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
      }
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }
      return date.toLocaleDateString();
    };

    // Watch for changes to the selected conversation (including deep changes)
    watch(
      selectedConversation,
      (newConv) => {
        if (newConv) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      },
      { immediate: true, deep: true }
    );

    // Watch for changes to the conversation list
    watch(
      conversations,
      () => {
        if (selectedConversation.value) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      },
      { deep: true }
    );

    // Original watches
    watch(
      () => store.selectedConversation?.last_message,
      (newLastMessage) => {
        if (newLastMessage) {
          scrollToBottom();
        }
      },
      { deep: true }
    );

    return {
      loading: store.loading,
      loadingMessages,
      conversations,
      selectedConversation,
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
/* Styles remain unchanged */
.messages-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 112px);
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
    height: calc(100vh - 112px);
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
    height: calc(100% - 130px);
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .messages-container {
    height: calc(100vh - 112px);
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
