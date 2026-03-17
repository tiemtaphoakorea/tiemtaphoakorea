import { axios } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { CHAT_MESSAGE_TYPE } from "@/lib/constants";
import type { ChatMessage } from "@/types/api";
import type { ChatApiMessage } from "@/types/chat";

export const chatClient = {
  /**
   * Send a message to a chat room
   */
  async sendMessage(data: {
    roomId?: string;
    content: string;
    messageType?: (typeof CHAT_MESSAGE_TYPE)[keyof typeof CHAT_MESSAGE_TYPE];
    imageUrl?: string;
    guestId?: string;
  }) {
    return axios.post<{ message: ChatMessage; success: boolean }>(
      API_ENDPOINTS.CHAT.SEND,
      data,
    ) as unknown as Promise<{ message: ChatMessage; success: boolean }>;
  },

  /**
   * Upload an image for chat
   */
  async uploadImage(payload: { roomId: string; file: File; sendAsMessage?: boolean }) {
    const formData = new FormData();
    formData.append("roomId", payload.roomId);
    formData.append("file", payload.file);
    if (payload.sendAsMessage) {
      formData.append("sendAsMessage", "true");
    }
    return axios.post<{ url: string; message?: ChatMessage; success: boolean }>(
      API_ENDPOINTS.CHAT.UPLOAD,
      formData,
    ) as unknown as Promise<{ url: string; message?: ChatMessage; success: boolean }>;
  },

  /**
   * Load chat messages for a guest
   */
  async getGuestMessages(guestId: string) {
    return axios.get<{
      roomId?: string;
      currentUserId?: string;
      messages?: ChatApiMessage[];
    }>(API_ENDPOINTS.CHAT.SEND, {
      params: { guestId },
    }) as unknown as Promise<{
      roomId?: string;
      currentUserId?: string;
      messages?: ChatApiMessage[];
    }>;
  },
};
