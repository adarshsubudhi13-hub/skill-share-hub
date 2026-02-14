import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Match {
  id: string;
  requester_id: string;
  matched_user_id: string;
  skill_offered: string;
  skill_requested: string;
  status: string;
  created_at: string;
}

export function useMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["matches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Match[];
    },
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: { requester_id: string; matched_user_id: string; skill_offered: string; skill_requested: string }) => {
      // Check if an active match already exists between these two users (in either direction)
      const { data: existing } = await supabase
        .from("matches")
        .select("id, status")
        .or(
          `and(requester_id.eq.${match.requester_id},matched_user_id.eq.${match.matched_user_id}),` +
          `and(requester_id.eq.${match.matched_user_id},matched_user_id.eq.${match.requester_id})`
        )
        .in("status", ["pending", "accepted"]);

      if (existing && existing.length > 0) {
        throw new Error("You already have an active swap with this user.");
      }

      const { error } = await supabase.from("matches").insert(match);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}

export function useUpdateMatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("matches").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["my-ratings"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useClearAllCompletedMatches() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      // Delete sessions first (referencing matches)
      const { error: sessErr } = await supabase
        .from("sessions")
        .delete()
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      // Delete matches as requester
      const { error: err1 } = await supabase
        .from("matches")
        .delete()
        .eq("status", "completed")
        .eq("requester_id", user.id);

      // Delete matches as matched user
      const { error: err2 } = await supabase
        .from("matches")
        .delete()
        .eq("status", "completed")
        .eq("matched_user_id", user.id);

      if (sessErr) throw sessErr;
      if (err1) throw err1;
      if (err2) throw err2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["my-ratings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
