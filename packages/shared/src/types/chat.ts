export interface ChatWidgetProps {
  userId?: string;
  guestId?: string;
  title?: string;
  phoneNumber?: string;
  messengerUrl?: string;
}

export interface RealtimeChatProps {
  userId?: string;
  guestId?: string;
}

export interface StoreChatMessage {
  id: string;
  serverId?: string;
  isPending?: boolean;
  content: string | null;
  senderId: string;
  createdAt: string | null;
  sender: {
    fullName: string | null;
  };
}

export interface StoreDisplayMessage {
  id: string;
  senderId: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

export interface ChatBroadcastPayload {
  id: string;
  senderId: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

export interface ChatPostgresMessageRow {
  id: string;
  sender_id: string;
  content: string | null;
  created_at: string | null;
}

export interface ChatApiMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  isRead: boolean | null;
  createdAt: string | null;
}

export interface ChatMessageItemProps {
  message: StoreDisplayMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export interface ChatTypingPayload {
  roomId: string;
  senderId: string;
  senderName: string;
  isTyping: boolean;
}
