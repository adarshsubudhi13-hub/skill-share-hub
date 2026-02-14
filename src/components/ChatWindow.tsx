import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar?: string;
    onClose?: () => void;
}

export default function ChatWindow({ otherUserId, otherUserName, otherUserAvatar, onClose }: ChatWindowProps) {
    const { user } = useAuth();
    const { messages, loading, sendMessage } = useChat(otherUserId);
    const [newMessage, setNewMessage] = useState("");
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const msgText = newMessage.trim();
        if (!msgText) return;

        try {
            setNewMessage(""); // Clear early for better UX
            await sendMessage(msgText);
        } catch (error) {
            setNewMessage(msgText); // Restore if failed
            toast({
                title: "Failed to send",
                description: "There was an error sending your message. Please try again.",
                variant: "destructive",
            });
            console.error("Failed to send", error);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-[600px] w-full flex-col rounded-xl border bg-card shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={otherUserAvatar} />
                        <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <Link to={`/user/${otherUserId}`} className="font-semibold text-card-foreground hover:text-primary transition-colors">
                            {otherUserName}
                        </Link>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center text-sm text-muted-foreground">Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${isMe
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                            {format(new Date(msg.created_at), "HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t p-4">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
