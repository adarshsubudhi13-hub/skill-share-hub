import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Heart } from "lucide-react";

export default function RealtimeNotifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user) return;

        let flashInterval: NodeJS.Timeout | null = null;
        const originalTitle = document.title;

        const clearFlash = () => {
            if (flashInterval) {
                clearInterval(flashInterval);
                flashInterval = null;
                document.title = originalTitle;
            }
        };

        const startFlash = () => {
            if (flashInterval || !document.hidden) return;

            let isFlash = false;
            flashInterval = setInterval(() => {
                document.title = isFlash ? originalTitle : "🔴 New Message!";
                isFlash = !isFlash;
            }, 1000);

            // Auto-stop after 5 seconds
            setTimeout(clearFlash, 5000);
        };

        window.addEventListener("focus", clearFlash);
        window.addEventListener("click", clearFlash);

        // 1. Listen for new messages
        const messageChannel = supabase
            .channel("global-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${user.id}`,
                },
                async (payload) => {
                    const newMsg = payload.new;

                    // Trigger flash ONLY if the tab is not focused
                    if (document.hidden) {
                        startFlash();
                    }

                    // Auto-remove notification from badge after 5 seconds
                    setTimeout(async () => {
                        await supabase
                            .from("messages")
                            .update({ read: true })
                            .eq("id", newMsg.id);

                        // Invalidate unread count to force badge update
                        queryClient.invalidateQueries({ queryKey: ["unread-count", user.id] });
                    }, 5000);

                    // Get sender name
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("name")
                        .eq("user_id", newMsg.sender_id)
                        .single();

                    toast({
                        title: "New Message",
                        description: `${profile?.name || "Someone"} sent you a message: "${newMsg.content.substring(0, 30)}${newMsg.content.length > 30 ? "..." : ""}"`,
                        duration: 5000, // Show toast for only 5 seconds
                        action: (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                        ),
                    });
                }
            )
            .subscribe();

        // 2. Listen for new match requests
        const matchChannel = supabase
            .channel("global-matches")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "matches",
                    filter: `matched_user_id=eq.${user.id}`,
                },
                async (payload) => {
                    const newMatch = payload.new;

                    // Get requester name
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("name")
                        .eq("user_id", newMatch.requester_id)
                        .single();

                    toast({
                        title: "New Swap Request!",
                        description: `${profile?.name || "Someone"} wants to trade ${newMatch.skill_offered} for your ${newMatch.skill_requested}.`,
                        action: (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                                <Heart className="h-4 w-4 text-secondary" />
                            </div>
                        ),
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(matchChannel);
            window.removeEventListener("focus", clearFlash);
            window.removeEventListener("click", clearFlash);
            clearFlash();
        };
    }, [user, toast]);

    return null;
}
