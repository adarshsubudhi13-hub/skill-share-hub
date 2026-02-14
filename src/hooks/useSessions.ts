import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Session {
    id: string;
    match_id: string | null;
    teacher_id: string; // mapped from user1_id
    learner_id: string; // mapped from user2_id
    skill_name: string; // mapped from skill_exchanged
    status: string;
    session_date: string;
    teacher?: { name: string };
    learner?: { name: string };
}

export function useSessions() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["sessions", user?.id],
        enabled: !!user,
        queryFn: async () => {
            // 1. Fetch sessions
            const { data: sessions, error } = await supabase
                .from("sessions")
                .select("*")
                .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (!sessions || sessions.length === 0) return [];

            // 2. Fetch all involved profiles to get names
            const userIds = Array.from(new Set(sessions.flatMap(s => [s.user1_id, s.user2_id])));
            const { data: profiles } = await supabase
                .from("profiles")
                .select("user_id, name")
                .in("user_id", userIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

            // 3. Map names back to sessions and deduplicate
            const mapped = sessions.map((s) => ({
                ...s,
                teacher_id: s.user1_id,
                learner_id: s.user2_id,
                skill_name: s.skill_exchanged,
                session_date: s.session_date || s.created_at,
                teacher: { name: profileMap.get(s.user1_id) || "Teacher" },
                learner: { name: profileMap.get(s.user2_id) || "Learner" }
            })) as Session[];

            // Deduplicate: keep one session per user-pair + skill
            const seen = new Set<string>();
            return mapped.filter((s) => {
                const key = [s.teacher_id, s.learner_id].sort().join("_") + "_" + (s.skill_name || "").toLowerCase().trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
    });
}
