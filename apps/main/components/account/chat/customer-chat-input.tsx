import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Image as ImageIcon, Loader2, Send } from "lucide-react";

interface CustomerChatInputProps {
  newMessage: string;
  setNewMessage: (val: string) => void;
  isSending: boolean;
  isUploading: boolean;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function CustomerChatInput({
  newMessage,
  setNewMessage,
  isSending,
  isUploading,
  onSend,
  onKeyPress,
  onImageUpload,
  fileInputRef,
  inputRef,
}: CustomerChatInputProps) {
  return (
    <div className="bg-card border-t p-4">
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImageUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </Button>

        <Input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Nhập tin nhắn..."
          className="flex-1"
          disabled={isSending || isUploading}
        />

        <Button onClick={onSend} disabled={!newMessage.trim() || isSending || isUploading}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
