import { Conversation } from "@/types/types";

export const mockConversations: Conversation[] = [
  {
    id: 1,
    otherUser: {
      id: 2,
      username: "sarahb",
      name: "Sarah Banda", // Add name field
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    lastMessage: {
      id: 101,
      text: "Hi, is this product still available?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isOwn: false,
      sender_id: 2,
      receiver_id: 1,
    },
    messages: [
      {
        id: 100,
        text: "Hello, I'm interested in your iPhone 13",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        isOwn: false,
        sender_id: 2,
        receiver_id: 1,
      },
      {
        id: 101,
        text: "Hi, is this product still available?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isOwn: false,
        sender_id: 2,
        receiver_id: 1,
      },
    ],
    unreadCount: 2,
  },
  {
    id: 2,
    otherUser: {
      id: 3,
      username: "johnp",
      name: "John Phiri", // Add name field
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    lastMessage: {
      id: 201,
      text: "Thank you, I'll make the payment tomorrow!",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isOwn: true,
      sender_id: 1,
      receiver_id: 3,
    },
    messages: [
      {
        id: 200,
        text: "Can you deliver to Area 47?",
        timestamp: new Date(Date.now() - 1000 * 60 * 35),
        isOwn: false,
        sender_id: 3,
        receiver_id: 1,
      },
      {
        id: 201,
        text: "Yes, delivery to Area 47 is possible. It will cost K2000",
        timestamp: new Date(Date.now() - 1000 * 60 * 32),
        isOwn: true,
        sender_id: 1,
        receiver_id: 3,
      },
      {
        id: 202,
        text: "Thank you, I'll make the payment tomorrow!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: false,
        sender_id: 3,
        receiver_id: 1,
      },
    ],
    unreadCount: 0,
  },
  {
    id: 3,
    otherUser: {
      id: 4,
      username: "maryt",
      name: "Mary Tembo", // Add name field
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    lastMessage: {
      id: 301,
      text: "Price is negotiable?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isOwn: false,
      sender_id: 4,
      receiver_id: 1,
    },
    messages: [
      {
        id: 300,
        text: "Hello, I saw your laptop listing",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.1),
        isOwn: false,
        sender_id: 4,
        receiver_id: 1,
      },
      {
        id: 301,
        text: "Price is negotiable?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isOwn: false,
        sender_id: 4,
        receiver_id: 1,
      },
    ],
    unreadCount: 1,
  },
];
