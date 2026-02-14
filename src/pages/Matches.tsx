import { useAuth } from "@/lib/auth";
import { useProfile, useAllProfiles, Profile } from "@/hooks/useProfile";
import { useMatches, useCreateMatch } from "@/hooks/useMatches";
import { Button } from "@/components/ui/button";
import { useMatchFinder, PotentialMatch } from "@/hooks/useMatchFinder";
import MatchCard from "@/components/MatchCard";
import { Navigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Users, Star, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SkillBadge from "@/components/SkillBadge";

export default function Matches() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: allProfiles } = useAllProfiles();
  const { data: matches } = useMatches();
  const createMatch = useCreateMatch();
  const potentialMatches = useMatchFinder(profile, allProfiles, matches);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  if (authLoading || isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" />;

  const requestedUserIds = new Set(
    matches?.filter((m) => m.status === "pending" || m.status === "accepted")
      .map((m) => (m.requester_id === user.id ? m.matched_user_id : m.requester_id))
  );

  // Filter potential matches (mutual exchange matches)
  const filteredMatches = potentialMatches.filter((pm) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      pm.profile.name.toLowerCase().includes(q) ||
      pm.theirSkillIWant.some((s) => s.toLowerCase().includes(q)) ||
      pm.mySkillTheyWant.some((s) => s.toLowerCase().includes(q)) ||
      (pm.profile.skills_offered || []).some((s) => s.toLowerCase().includes(q)) ||
      (pm.profile.skills_wanted || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  // When searching, also find ALL profiles that match the search term
  // (even if they're not mutual matches)
  const searchResults: Profile[] = (() => {
    if (!search || !allProfiles || !profile) return [];
    const q = search.toLowerCase();
    const matchedUserIds = new Set(filteredMatches.map((pm) => pm.profile.user_id));

    return allProfiles.filter((p) => {
      if (p.user_id === user.id) return false; // Exclude self
      if (matchedUserIds.has(p.user_id)) return false; // Already shown in matches
      return (
        p.name.toLowerCase().includes(q) ||
        (p.skills_offered || []).some((s) => s.toLowerCase().includes(q)) ||
        (p.skills_wanted || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  })();

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">All Matches</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or skill..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Mutual matches section */}
      {filteredMatches.length > 0 && (
        <div className="space-y-3">
          {search && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skill Swap Matches</h2>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((pm) => (
              <MatchCard
                key={pm.profile.id}
                match={pm}
                onRequest={handleRequest}
                alreadyRequested={requestedUserIds.has(pm.profile.user_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Additional search results (non-mutual matches) */}
      {search && searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Other users matching "{search}"
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/user/${p.user_id}`}
                      className="font-display text-lg font-semibold text-card-foreground hover:text-primary transition-colors"
                    >
                      {p.name || "Anonymous"}
                    </Link>
                    {p.bio && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.bio}</p>}
                  </div>
                  {p.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {Number(p.rating).toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Skills they offer */}
                {p.skills_offered && p.skills_offered.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Can teach</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills_offered.map((s) => (
                        <SkillBadge key={s} skill={s} variant="offered" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills they want */}
                {p.skills_wanted && p.skills_wanted.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Wants to learn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills_wanted.map((s) => (
                        <SkillBadge key={s} skill={s} variant="wanted" />
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link to={`/user/${p.user_id}`}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    See Profile
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredMatches.length === 0 && searchResults.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/50 p-12 text-center text-muted-foreground">
          <Users className="mx-auto h-10 w-10 mb-3" />
          <p>{search ? `No users found for "${search}".` : "No matching users found."}</p>
        </div>
      )}
    </div>
  );
}
