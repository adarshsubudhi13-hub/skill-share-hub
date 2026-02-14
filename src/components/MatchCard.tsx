import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SkillBadge from "./SkillBadge";
import { Star, ArrowRightLeft, Eye } from "lucide-react";
import type { PotentialMatch } from "@/hooks/useMatchFinder";

interface MatchCardProps {
  match: PotentialMatch;
  onRequest: (match: PotentialMatch) => void;
  alreadyRequested?: boolean;
}

export default function MatchCard({ match, onRequest, alreadyRequested }: MatchCardProps) {
  const { profile, mySkillTheyWant, theirSkillIWant } = match;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/user/${profile.user_id}`}
            className="font-display text-lg font-semibold text-card-foreground hover:text-primary transition-colors"
          >
            {profile.name || "Anonymous"}
          </Link>
          {profile.bio && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>}
        </div>
        {profile.rating > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            {Number(profile.rating).toFixed(1)}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">They can teach you</p>
          <div className="flex flex-wrap gap-1.5">
            {theirSkillIWant.length > 0 ? (
              theirSkillIWant.map((s) => <SkillBadge key={s} skill={s} variant="offered" />)
            ) : (
              <span className="text-xs text-muted-foreground italic transition-opacity group-hover:opacity-80">No direct skill match</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center text-muted-foreground/50">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">You can teach them</p>
          <div className="flex flex-wrap gap-1.5">
            {mySkillTheyWant.length > 0 ? (
              mySkillTheyWant.map((s) => <SkillBadge key={s} skill={s} variant="wanted" />)
            ) : (
              <span className="text-xs text-muted-foreground italic transition-opacity group-hover:opacity-80">No direct skill match</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          asChild
        >
          <Link to={`/user/${profile.user_id}`}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            See Profile
          </Link>
        </Button>
        <Button
          variant={alreadyRequested ? "outline" : "hero"}
          size="sm"
          className="flex-1"
          disabled={alreadyRequested}
          onClick={() => onRequest(match)}
        >
          {alreadyRequested
            ? "Request Sent"
            : theirSkillIWant[0] ? `Swap: ${theirSkillIWant[0]}` : "Request Swap"}
        </Button>
      </div>
    </div>
  );
}
