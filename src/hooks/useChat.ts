import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

export function useChat(otherUserId: string | null) {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const markAsRead = async () => {
        if (!user || !otherUserId) return;
        const { error } = await supabase
            .from("messages")
            .update({ read: true })
            .eq("receiver_id", user.id)
            .eq("sender_id", otherUserId)
            .eq("read", false);

        if (error) {
            console.error("Error marking messages as read:", error);
        } else {
            qc.invalidateQueries({ queryKey: ["unread-count", user.id] });
        }
    };

    useEffect(() => {
        if (user && otherUserId) {
            markAsRead();
        }
    }, [user, otherUserId]);

    useEffect(() => {
        if (!user || !otherUserId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
            } else {
                setMessages(data || []);
            }
            setLoading(false);
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat_${otherUserId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    const isRelevant =
                        (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id) ||
                        (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId);

                    if (isRelevant) {
                        setMessages((prev) => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        if (newMsg.receiver_id === user.id) {
                            markAsRead();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, otherUserId]);

    const sendMessage = async (content: string) => {
        if (!user || !otherUserId) return;

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id: otherUserId,
                content,
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            throw error;
        }

        if (data) {
            setMessages((prev) => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data as Message];
            });
        }
    };

    return { messages, loading, sendMessage, markAsRead };
}
