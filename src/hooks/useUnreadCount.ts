import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo } from "react";

export function useUnreadCount() {
    const { user } = useAuth();
    const qc = useQueryClient();

    // Capture the time the app was opened/refreshed
    const sessionStartTime = useMemo(() => new Date().toISOString(), []);

    const query = useQuery({
        queryKey: ["unread-count", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { count, error } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user!.id)
                .eq("read", false)
                .gt("created_at", sessionStartTime); // Only count messages from THIS session

            if (error) throw error;
            return count || 0;
        },
    });

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel("unread-messages")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    qc.invalidateQueries({ queryKey: ["unread-count", user.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, qc]);

    return query;
}
