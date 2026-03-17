---
id: SPEC-016
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Chat System

## Related Epics

- [[Epic-08-Chat]]

## Module Notes

### Module 8: Chat System (Real-time)

**Mục tiêu**: Hỗ trợ khách hàng trực tuyến qua Website.

---

#### 1. Tính Năng (Features)

- **8.1 Real-time Messaging**: Gửi/nhận tin ngay lập tức (Supabase Realtime).
- **8.2 Admin Inbox**: Quản lý nhiều hội thoại cùng lúc.
- **8.3 Media**: Gửi ảnh (dùng Supabase Storage).

---

#### 2. Thiết Kế (Design)

##### UI Components

- **RealtimeChat (Storefront/Guest Side)**: Floating realtime chat panel.
  - Nếu user chưa có info -> Hỏi Name/Phone để start chat (Tạo Guest Profile).
- **InboxPage (Admin Side)**:
  - Sidebar: List conversations (Unread bold).
  - Main: Chat window.

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Guest Identification

- Khách mở chat -> Fill form (Tên, SĐT).
- System check `profiles` by SĐT:
  - Có -> Attach session vào Customer ID đó.
  - Không -> Create Profile (Role: Customer).
- Create `chat_room`.

##### 3.2 Real-time Subscriptions

- Admin subscribe channel `rooms:all`.
- Guest subscribe channel `room:{roomId}`.

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`chat_rooms`**: `customer_id`.
- **`chat_messages`**: `room_id`, `sender_id`, `content`, `image_url`.

## Feature Details

### F05: Hệ thống Chat

#### 1. Tổng quan

Module chat cung cấp kênh liên lạc trực tiếp giữa Admin và khách (guest) thông qua giao diện chat real-time. Mỗi khách hàng có một phòng chat riêng với shop.

##### 1.1 Phạm vi

- Chat real-time giữa Admin và khách (guest)
- Hỗ trợ gửi tin nhắn văn bản và hình ảnh
- Mỗi khách hàng có 1 phòng chat duy nhất
- Lịch sử chat được lưu trữ vĩnh viễn
- Thông báo tin nhắn mới (trong ứng dụng)

##### 1.2 Actors

| Actor | Mô tả                                 |
| ----- | ------------------------------------- |
| Admin | Trả lời tin nhắn từ tất cả khách hàng |
| Guest | Gửi tin nhắn đến shop                 |

---

#### 2. User Stories

##### US-05-01: Gửi tin nhắn văn bản

**Là** Admin/Guest  
**Tôi muốn** gửi tin nhắn văn bản  
**Để** trao đổi thông tin với shop/khách hàng

**Acceptance Criteria:**

- Nhập tin nhắn và gửi bằng Enter hoặc nút gửi
- Tin nhắn hiển thị ngay lập tức cho cả hai bên
- Hiển thị thời gian gửi tin nhắn

##### US-05-02: Gửi hình ảnh

**Là** Admin/Guest  
**Tôi muốn** gửi hình ảnh trong chat  
**Để** chia sẻ ảnh sản phẩm, hóa đơn, vv

**Acceptance Criteria:**

- Upload ảnh từ máy tính/điện thoại
- Hỗ trợ định dạng: JPG, PNG, WebP
- Giới hạn kích thước: 5MB/ảnh
- Hiển thị ảnh thumbnail trong chat

##### US-05-03: Xem danh sách chat (Admin)

**Là** Admin  
**Tôi muốn** xem danh sách tất cả phòng chat  
**Để** quản lý và trả lời tin nhắn khách hàng

**Acceptance Criteria:**

- Hiển thị danh sách khách hàng đã chat
- Hiển thị tin nhắn cuối cùng
- Đánh dấu phòng có tin nhắn chưa đọc
- Sắp xếp theo thời gian tin nhắn mới nhất

##### US-05-04: Xem lịch sử chat

**Là** Admin/Guest  
**Tôi muốn** xem lại lịch sử tin nhắn  
**Để** tham khảo thông tin đã trao đổi

**Acceptance Criteria:**

- Cuộn để xem tin nhắn cũ
- Load thêm tin nhắn khi cuộn lên
- Không giới hạn lịch sử

##### US-05-05: Nhận thông báo tin nhắn mới

**Là** Admin  
**Tôi muốn** biết khi có tin nhắn mới  
**Để** trả lời khách hàng kịp thời

**Acceptance Criteria:**

- Badge số tin nhắn chưa đọc trên menu Chat
- Real-time update không cần refresh
- Âm thanh thông báo (optional)

---

#### 3. Thiết kế hệ thống

##### 3.1 Kiến trúc Chat Real-time

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KIẾN TRÚC CHAT REAL-TIME                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐                               ┌─────────┐            │
│   │ Admin   │                               │ Guest   │            │
│   │ Browser │                               │ Browser │            │
│   └────┬────┘                               └────┬────┘            │
│        │                                         │                  │
│        │  WebSocket Connection                   │                  │
│        │                                         │                  │
│        ▼                                         ▼                  │
│   ┌────────────────────────────────────────────────────┐           │
│   │              Supabase Realtime                     │           │
│   │                                                    │           │
│   │  ┌─────────────────────────────────────────────┐  │           │
│   │  │  Channel: chat_room_{room_id}               │  │           │
│   │  │                                             │  │           │
│   │  │  • Subscribe to new messages                │  │           │
│   │  │  • Broadcast on INSERT                      │  │           │
│   │  └─────────────────────────────────────────────┘  │           │
│   └────────────────────────────────────────────────────┘           │
│                           │                                         │
│                           ▼                                         │
│   ┌────────────────────────────────────────────────────┐           │
│   │                 PostgreSQL                         │           │
│   │                                                    │           │
│   │  ┌──────────────┐    ┌──────────────────────┐    │           │
│   │  │  chat_rooms  │◄───│    chat_messages     │    │           │
│   │  └──────────────┘    └──────────────────────┘    │           │
│   │                                                    │           │
│   └────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

##### 3.2 Luồng gửi tin nhắn

```
┌──────────────────────────────────────────────────────────────────────┐
│                        GỬI TIN NHẮN                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User nhập tin nhắn                                               │
│     └─► Client: Input text / Select image                           │
│                                                                      │
│  2. Gửi tin nhắn                                                     │
│     ├─► Text: POST /api/chat/messages                               │
│     └─► Image: Upload to Supabase Storage first                     │
│                                                                      │
│  3. Server xử lý                                                     │
│     ├─► Validate message content                                    │
│     ├─► Insert vào chat_messages                                    │
│     └─► Supabase Realtime broadcast                                 │
│                                                                      │
│  4. Client nhận tin                                                  │
│     ├─► Subscription callback triggered                             │
│     ├─► Append message to chat list                                 │
│     └─► Update unread count (admin side)                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

##### 3.3 Data Model

```sql
-- chat_rooms: 1 room per customer
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(customer_id)
);

-- chat_messages: Messages in rooms
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message_type VARCHAR(10) DEFAULT 'text', -- 'text' | 'image'
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_rooms_customer_id ON chat_rooms(customer_id);
```

---

#### 4. Thiết kế UI

##### 4.1 Danh sách Chat (Admin)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIN NHẮN                                               [🔍 Tìm kiếm...] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 KH003 - Nguyễn Thị Lan                              14:30 hôm nay│ │
│ │    Cho em hỏi sản phẩm ABC còn hàng không ạ?                        │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ 🔴 KH007 - Trần Văn Minh                               13:15 hôm nay│ │
│ │    [Hình ảnh]                                                       │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │    KH001 - Nguyễn Thị Hương                            Hôm qua      │ │
│ │    Dạ em cảm ơn chị ạ                                               │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │    KH002 - Lê Thị Mai                                  25/12/2025   │ │
│ │    Ok chị, em đợi hàng về nha                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 🔴 = Tin nhắn chưa đọc                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 4.2 Cửa sổ Chat (Admin)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← TIN NHẮN          KH003 - Nguyễn Thị Lan               [📋 Thông tin]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          25/12/2025                                     │
│                                                                         │
│  ┌──────────────────────────────────────┐                              │
│  │ Chào shop, em muốn hỏi về son MAC ạ  │ 09:30                        │
│  └──────────────────────────────────────┘                              │
│                                                                         │
│                    ┌────────────────────────────────────┐              │
│              09:32 │ Chào em, shop có sẵn nhiều màu     │              │
│                    │ em muốn xem màu nào ạ?             │              │
│                    └────────────────────────────────────┘              │
│                                                                         │
│  ┌──────────────────────────────────────┐                              │
│  │ Em muốn xem màu đỏ Ruby Woo ạ        │ 09:35                        │
│  └──────────────────────────────────────┘                              │
│                                                                         │
│                    ┌────────────────────────────────────┐              │
│              09:36 │ ┌────────────────────┐             │              │
│                    │ │   [Ảnh sản phẩm]   │             │              │
│                    │ │                    │             │              │
│                    │ └────────────────────┘             │              │
│                    │ Đây em nha, còn 5 cây              │              │
│                    └────────────────────────────────────┘              │
│                                                                         │
│                          Hôm nay                                        │
│                                                                         │
│  ┌──────────────────────────────────────────────────┐                  │
│  │ Cho em hỏi sản phẩm ABC còn hàng không ạ?        │ 14:30            │
│  └──────────────────────────────────────────────────┘                  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ [📷] [➤]  │
│ │ Nhập tin nhắn...                                        │            │
│ └─────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 4.3 Panel thông tin khách hàng

```
┌─────────────────────────────────┐
│ THÔNG TIN KHÁCH HÀNG           │
├─────────────────────────────────┤
│                                 │
│ Mã KH: KH003                    │
│ Tên: Nguyễn Thị Lan            │
│ SĐT: 0912345678                 │
│ Loại: Bán lẻ                    │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ THỐNG KÊ                        │
│ • Tổng đơn: 5                   │
│ • Tổng chi tiêu: 2,500,000đ    │
│ • Đơn gần nhất: 20/12/2025     │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ [📦 Xem đơn hàng]               │
│ [✏️ Tạo đơn mới]                │
│                                 │
└─────────────────────────────────┘
```

##### 4.4 Chat (Guest View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CHAT VỚI SHOP                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          Hôm nay                                        │
│                                                                         │
│  ┌──────────────────────────────────────────────────┐                  │
│  │ Cho em hỏi sản phẩm ABC còn hàng không ạ?        │ 14:30            │
│  └──────────────────────────────────────────────────┘                  │
│                                                                         │
│  (Khách đang chờ phản hồi...)                                          │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ [📷] [➤]  │
│ │ Nhập tin nhắn...                                        │            │
│ └─────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 5. Triển khai kỹ thuật

##### 5.1 API Routes

```
app/routes/
├── admin.chat._index.tsx         # Danh sách chat rooms
├── admin.chat.$roomId.tsx        # Chat với khách hàng
├── customer.chat.tsx             # Chat với shop
└── api.chat.messages.tsx         # API gửi tin nhắn
```

##### 5.2 Code Implementation

###### Lấy danh sách Chat Rooms (Admin)

```typescript
// app/models/chat.server.ts

interface ChatRoomWithLatest {
  id: string;
  customer: {
    id: string;
    full_name: string;
    customer_code: string;
  };
  lastMessage: {
    content: string;
    message_type: string;
    created_at: string;
    is_read: boolean;
  } | null;
  unreadCount: number;
}

export async function getChatRooms(
  supabase: SupabaseClient,
): Promise<ChatRoomWithLatest[]> {
  // Get all chat rooms with customer info
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      customer:profiles!customer_id (
        id,
        full_name,
        customer_code
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Get last message and unread count for each room
  const roomsWithMessages = await Promise.all(
    (rooms || []).map(async (room) => {
      // Get last message
      const { data: lastMessages } = await supabase
        .from("chat_messages")
        .select("content, message_type, created_at, is_read, sender_id")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Count unread messages (messages from customer that admin hasn't read)
      const { count: unreadCount } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .eq("is_read", false)
        .eq("sender_id", room.customer.id);

      return {
        id: room.id,
        customer: room.customer,
        lastMessage: lastMessages?.[0] || null,
        unreadCount: unreadCount || 0,
      };
    }),
  );

  // Sort by last message time
  return roomsWithMessages.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return (
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
    );
  });
}
```

###### Lấy tin nhắn trong phòng chat

```typescript
// app/models/chat.server.ts

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: "text" | "image";
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  sender: {
    full_name: string;
    role: string;
  };
}

export async function getChatMessages(
  supabase: SupabaseClient,
  roomId: string,
  limit: number = 50,
  before?: string,
): Promise<ChatMessage[]> {
  let query = supabase
    .from("chat_messages")
    .select(
      `
      *,
      sender:profiles!sender_id (
        full_name,
        role
      )
    `,
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Return in chronological order
  return (data || []).reverse();
}
```

###### Gửi tin nhắn

```typescript
// app/models/chat.server.ts

interface SendMessageInput {
  roomId: string;
  senderId: string;
  content: string;
  messageType?: "text" | "image";
  imageUrl?: string;
}

export async function sendMessage(
  supabase: SupabaseClient,
  input: SendMessageInput,
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: input.roomId,
      sender_id: input.senderId,
      message_type: input.messageType || "text",
      content: input.content,
      image_url: input.imageUrl,
      is_read: false,
    })
    .select(
      `
      *,
      sender:profiles!sender_id (
        full_name,
        role
      )
    `,
    )
    .single();

  if (error) throw error;

  // Update room's updated_at
  await supabase
    .from("chat_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.roomId);

  return data;
}
```

###### Upload hình ảnh chat

```typescript
// app/models/chat.server.ts

export async function uploadChatImage(
  supabase: SupabaseClient,
  roomId: string,
  file: File,
): Promise<string> {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Chỉ hỗ trợ định dạng JPG, PNG, WebP");
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Kích thước file tối đa 5MB");
  }

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const filename = `${roomId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("chat-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("chat-images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
```

###### Đánh dấu đã đọc

```typescript
// app/models/chat.server.ts

export async function markMessagesAsRead(
  supabase: SupabaseClient,
  roomId: string,
  readerId: string,
) {
  // Mark all messages from the other party as read
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .neq("sender_id", readerId)
    .eq("is_read", false);

  if (error) throw error;

  return { success: true };
}
```

###### Đếm tin nhắn chưa đọc (Admin)

```typescript
// app/models/chat.server.ts

export async function getUnreadCount(
  supabase: SupabaseClient,
): Promise<number> {
  // Get all chat rooms
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("id, customer_id");

  if (!rooms?.length) return 0;

  // Count unread messages from customers
  let totalUnread = 0;
  for (const room of rooms) {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("sender_id", room.customer_id)
      .eq("is_read", false);

    totalUnread += count || 0;
  }

  return totalUnread;
}
```

##### 5.3 Real-time Subscription (Client)

```typescript
// app/hooks/useChat.ts

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Message {
  id: string;
  content: string;
  message_type: "text" | "image";
  image_url?: string;
  sender_id: string;
  created_at: string;
  sender: {
    full_name: string;
    role: string;
  };
}

export function useChat(roomId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);

  const supabase = createBrowserClient(
    window.ENV.SUPABASE_URL,
    window.ENV.SUPABASE_PUBLISHABLE_KEY,
  );

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data: newMessage } = await supabase
            .from("chat_messages")
            .select(
              `
              *,
              sender:profiles!sender_id (
                full_name,
                role
              )
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  const sendMessage = useCallback(
    async (
      content: string,
      senderId: string,
      messageType: "text" | "image" = "text",
      imageUrl?: string,
    ) => {
      const { error } = await supabase.from("chat_messages").insert({
        room_id: roomId,
        sender_id: senderId,
        content,
        message_type: messageType,
        image_url: imageUrl,
      });

      if (error) throw error;
    },
    [roomId, supabase],
  );

  return {
    messages,
    isConnected,
    sendMessage,
  };
}
```

##### 5.4 Chat Component (React)

```tsx
// app/components/ChatWindow.tsx

import { useChat } from "@/hooks/useChat";
import { useState, useRef, useEffect } from "react";

interface ChatWindowProps {
  roomId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function ChatWindow({
  roomId,
  currentUserId,
  initialMessages,
}: ChatWindowProps) {
  const { messages, isConnected, sendMessage } = useChat(
    roomId,
    initialMessages,
  );
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage, currentUserId);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      // Upload image first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const { imageUrl } = await response.json();

      // Send image message
      await sendMessage("[Hình ảnh]", currentUserId, "image", imageUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          Đang kết nối...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded"
          disabled={isSending}
        >
          📷
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border rounded-lg px-4 py-2"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isSending ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const time = new Date(message.created_at).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-100"
        }`}
      >
        {message.message_type === "image" && message.image_url ? (
          <img
            src={message.image_url}
            alt="Chat image"
            className="max-w-full rounded cursor-pointer"
            onClick={() => window.open(message.image_url, "_blank")}
          />
        ) : null}

        {message.message_type === "text" && (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        <p
          className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
```

---

#### 6. Row Level Security (RLS)

```sql
-- Policies cho chat_rooms
CREATE POLICY "Admin can view all chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies cho chat_messages
CREATE POLICY "Admin can view all messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Admin can update message read status"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    -- Only allow updating is_read field
    TRUE
  );
```

---

#### 7. Validation Rules

##### 7.1 Tin nhắn văn bản

| Trường  | Rule                | Message                      |
| ------- | ------------------- | ---------------------------- |
| content | Required            | Vui lòng nhập tin nhắn       |
| content | Max 2000 chars      | Tin nhắn tối đa 2000 ký tự   |
| content | Not only whitespace | Tin nhắn không được để trống |

##### 7.2 Hình ảnh

| Trường    | Rule           | Message                             |
| --------- | -------------- | ----------------------------------- |
| file type | JPG, PNG, WebP | Chỉ hỗ trợ định dạng JPG, PNG, WebP |
| file size | Max 5MB        | Kích thước file tối đa 5MB          |

---

#### 8. Test Cases

##### TC-05-01: Gửi tin nhắn văn bản thành công

**Precondition:** User đã đăng nhập và vào phòng chat  
**Steps:**

1. Nhập "Xin chào"
2. Nhấn Enter hoặc click gửi

**Expected:**

- Tin nhắn hiển thị trong chat
- Đối phương nhận được tin nhắn real-time

##### TC-05-02: Gửi hình ảnh thành công

**Precondition:** User đã đăng nhập  
**Steps:**

1. Click icon camera
2. Chọn file ảnh JPG < 5MB
3. Chờ upload

**Expected:**

- Ảnh được gửi và hiển thị trong chat
- Có thể click để xem ảnh đầy đủ

##### TC-05-03: Gửi file quá lớn

**Steps:**

1. Click icon camera
2. Chọn file ảnh > 5MB

**Expected:** Hiển thị lỗi "Kích thước file tối đa 5MB"

##### TC-05-04: Admin xem danh sách chat

**Precondition:** Có nhiều khách hàng đã chat  
**Steps:**

1. Admin vào trang Chat

**Expected:**

- Hiển thị danh sách phòng chat
- Sắp xếp theo tin nhắn mới nhất
- Badge hiển thị số tin chưa đọc

##### TC-05-05: Real-time message

**Precondition:** Admin và khách mở cùng phòng chat  
**Steps:**

1. Khách gửi tin nhắn

**Expected:**

- Admin nhận tin nhắn ngay lập tức không cần refresh
- Badge tin chưa đọc tăng (nếu Admin không ở phòng đó)

##### TC-05-06: Đánh dấu đã đọc

**Precondition:** Có tin nhắn chưa đọc  
**Steps:**

1. Admin mở phòng chat có tin chưa đọc

**Expected:**

- Tin nhắn được đánh dấu đã đọc
- Badge giảm về 0

#### 9. Business Rules

##### 9.1 Phòng chat

- Mỗi khách hàng có đúng 1 phòng chat
- Phòng chat được tạo tự động khi tạo hồ sơ khách hoặc khi khách mở chat lần đầu
- Lịch sử chat được giữ vĩnh viễn

##### 9.2 Tin nhắn

- Hỗ trợ 2 loại: text và image
- Tin nhắn không thể xóa hoặc sửa
- Độ dài tối đa: 2000 ký tự

##### 9.3 Hình ảnh

- Upload vào Supabase Storage bucket: chat-images
- Đường dẫn: chat-images/{room_id}/{timestamp}-{uuid}.{ext}
- Định dạng: JPG, PNG, WebP
- Kích thước tối đa: 5MB

##### 9.4 Real-time

- Sử dụng Supabase Realtime với postgres_changes
- Auto-reconnect khi mất kết nối
- Optimistic UI: tin nhắn hiển thị ngay khi gửi

##### 9.5 Quyền truy cập

- Admin: Xem tất cả phòng chat, gửi tin nhắn
- Khách: Truy cập phòng chat của mình qua liên kết/phiên chat
