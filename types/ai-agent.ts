export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export interface AutoReplyInput {
  roomId: string;
  triggerMessageId: string;
}
