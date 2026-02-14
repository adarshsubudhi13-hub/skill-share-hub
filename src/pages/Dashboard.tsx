import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useMatches, useCreateMatch, useUpdateMatchStatus, useDeleteMatch, useClearAllCompletedMatches } from "@/hooks/useMatches";
import { useMatchFinder, PotentialMatch } from "@/hooks/useMatchFinder";
import MatchCard from "@/components/MatchCard";
import RequestCard from "@/components/RequestCard";
import SkillBadge from "@/components/SkillBadge";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RatingDialog from "@/components/RatingDialog";
import { useSessions } from "@/hooks/useSessions";
import CompletedSessionCard from "@/components/CompletedSessionCard";
import { useState } from "react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: allProfiles } = useAllProfiles();
  const { data: matches } = useMatches();
  const createMatch = useCreateMatch();
  const updateStatus = useUpdateMatchStatus();
  const deleteMatch = useDeleteMatch();
  const clearAllCompleted = useClearAllCompletedMatches();
  const { data: sessions } = useSessions();
  const potentialMatches = useMatchFinder(profile, allProfiles, matches);
  const { toast } = useToast();
  const [ratingMatchId, setRatingMatchId] = useState<string | null>(null);
  const { data: myRatings } = useQuery({
    queryKey: ["my-ratings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("ratings").select("score").eq("rated_user", user!.id);
      return data || [];
    }
  });

  if (authLoading || profileLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" />;

  const profilesMap = new Map(allProfiles?.map((p) => [p.user_id, p]) ?? []);

  // Deduplicate matches: keep only one match per user pair per status
  const deduplicateMatches = (list: typeof matches) => {
    if (!list) return [];
    const seen = new Set<string>();
    return list.filter((m) => {
      const pair = [m.requester_id, m.matched_user_id].sort().join("_") + "_" + m.status;
      if (seen.has(pair)) return false;
      seen.add(pair);
      return true;
    });
  };

  const allDeduped = deduplicateMatches(matches);
  const pendingIncoming = allDeduped.filter((m) => m.matched_user_id === user.id && m.status === "pending");
  const pendingOutgoing = allDeduped.filter((m) => m.requester_id === user.id && m.status === "pending");
  const accepted = allDeduped.filter((m) => m.status === "accepted");
  const completed = allDeduped.filter((m) => m.status === "completed");

  const requestedUserIds = new Set(
    matches?.filter((m) => m.status === "pending" || m.status === "accepted")
      .map((m) => (m.requester_id === user.id ? m.matched_user_id : m.requester_id))
  );

  const handleRequest = (pm: PotentialMatch) => {
    const skillOffered = pm.mySkillTheyWant[0]
      || (profile?.skills_offered?.[0])
      || "General";
    const skillRequested = pm.theirSkillIWant[0]
      || (pm.profile.skills_offered?.[0])
      || "General";

    createMatch.mutate(
      {
        requester_id: user.id,
        matched_user_id: pm.profile.user_id,
        skill_offered: skillOffered,
        skill_requested: skillRequested,
      },
      {
        onSuccess: () => toast({ title: "Request sent!", description: `Offered: ${skillOffered} → Requested: ${skillRequested}` }),
        onError: (err) => toast({ title: "Error", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const handleAccept = (id: string) => updateStatus.mutate({ id, status: "accepted" });
  const handleReject = (id: string) => updateStatus.mutate({ id, status: "rejected" });
  const handleComplete = (id: string) => {
    const match = matches?.find((m) => m.id === id);
    updateStatus.mutate({ id, status: "completed" }, {
      onSuccess: () => {
        setRatingMatchId(id);
        if (match) {
          const addCredits = async (uid: string) => {
            // Try secure RPC first (bypass RLS for other user)
            const { error } = await supabase.rpc('increment_credits', { target_user_id: uid, amount: 10 } as any);

            // Fallback if RPC not deployed yet
            if (error) {
              console.warn("RPC failed, falling back to client-side update", error);
              const { data } = await supabase.from("profiles").select("skill_credits").eq("user_id", uid).single();
              if (data) {
                // This might fail for the other user due to RLS, but it's the best we can do without backend function
                await supabase.from("profiles").update({ skill_credits: (data.skill_credits || 0) + 10 } as any).eq("user_id", uid);
              }
            }
          };
          Promise.all([addCredits(match.requester_id), addCredits(match.matched_user_id)])
            .then(() => toast({ title: "Session Completed! 🎉", description: "+10 Skill Credits earned!" }));
        }
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteMatch.mutate(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all completed sessions?")) {
      clearAllCompleted.mutate();
    }
  };

  const myAvgRating = myRatings && myRatings.length > 0
    ? (myRatings.reduce((sum, r) => sum + r.score, 0) / myRatings.length).toFixed(1)
    : "—";

  const stats = [
    { icon: Star, label: "Rating", value: myAvgRating },
    { icon: BookOpen, label: "Sessions", value: sessions?.length || 0 },
    { icon: Users, label: "Matches", value: potentialMatches.length },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Profile Summary */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-card-foreground">
              Welcome, {profile?.name || "there"}! 👋
            </h1>
            {(!profile?.skills_offered?.length || !profile?.skills_wanted?.length) && (
              <p className="mt-1 text-sm text-secondary">
                Complete your profile to find matches →{" "}
                <Link to="/profile" className="underline">Edit Profile</Link>
              </p>
            )}
          </div>
          <div className="flex gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="mx-auto h-5 w-5 text-primary" />
                <p className="font-display text-xl font-bold text-card-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {profile?.skills_offered && profile.skills_offered.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills_offered.map((s) => <SkillBadge key={s} skill={s} variant="offered" />)}
            {profile.skills_wanted?.map((s) => <SkillBadge key={s} skill={s} variant="wanted" />)}
          </div>
        )}
      </div>

      {/* Incoming Requests */}
      {pendingIncoming.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Incoming Requests ({pendingIncoming.length})
          </h2>
          <div className="space-y-3">
            {pendingIncoming.map((m) => (
              <RequestCard
                key={m.id}
                match={m}
                otherProfile={profilesMap.get(m.requester_id)}
                isIncoming
                onAccept={handleAccept}
                onReject={handleReject}
                onDelete={handleDelete}
                currentUserName={profile?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Sessions */}
      {accepted.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Active Sessions ({accepted.length})
          </h2>
          <div className="space-y-3">
            {accepted.map((m) => {
              const otherId = m.requester_id === user.id ? m.matched_user_id : m.requester_id;
              return (
                <RequestCard
                  key={m.id}
                  match={m}
                  otherProfile={profilesMap.get(otherId)}
                  isIncoming={false}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  currentUserName={profile?.name}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Outgoing Requests */}
      {pendingOutgoing.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pendingOutgoing.map((m) => (
              <RequestCard
                key={m.id}
                match={m}
                otherProfile={profilesMap.get(m.matched_user_id)}
                isIncoming={false}
                onDelete={handleDelete}
                currentUserName={profile?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Potential Matches */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Potential Matches ({potentialMatches.length})
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/matches">
              See All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {potentialMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/50 p-8 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3" />
            <p>No matches yet. Add more skills to your profile!</p>
            <Button variant="hero" size="sm" className="mt-3" asChild>
              <Link to="/profile">Edit Profile</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {potentialMatches.slice(0, 6).map((pm) => (
              <MatchCard
                key={pm.profile.id}
                match={pm}
                onRequest={handleRequest}
                alreadyRequested={requestedUserIds.has(pm.profile.user_id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {(sessions?.length || 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Completed Sessions ({sessions?.length})
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
          <div className="grid gap-4">
            {sessions?.map((s) => (
              <CompletedSessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {ratingMatchId && (
        <RatingDialog
          matchId={ratingMatchId}
          onClose={() => setRatingMatchId(null)}
        />
      )}
    </div>
  );
}
