import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";
import type { Match } from "@/hooks/useMatches";
import type { Profile } from "@/hooks/useProfile";
import { useAuth } from "@/lib/auth";

interface RequestCardProps {
  match: Match;
  otherProfile: Profile | undefined;
  isIncoming: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUserName?: string;
}

export default function RequestCard({ match, otherProfile, isIncoming, onAccept, onReject, onComplete,
  onDelete,
  currentUserName
}: RequestCardProps) {
  const { user } = useAuth();
  const statusColors: Record<string, string> = {
    pending: "bg-secondary/15 text-secondary",
    accepted: "bg-accent text-accent-foreground",
    completed: "bg-primary/15 text-primary",
    rejected: "bg-destructive/15 text-destructive",
  };

  // teacher1 is always the requester
  // teacher2 is always the matched user
  const teacher1Name = isIncoming ? otherProfile?.name : "You";
  const teacher2Name = isIncoming ? "You" : otherProfile?.name;

  const displayUserName = currentUserName || "You";
  const isMeRequester = match.requester_id === user?.id;

  // What did I learn?
  // If I requested, I wanted the matched_user's skill (skill_requested)
  // If I was requested, I learned the requester's skill (skill_offered)
  const skillILearned = isMeRequester ? match.skill_requested : match.skill_offered;
  const taughtBy = otherProfile?.name || "User";

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-card">
      <div className="min-w-0 flex-1">
        {match.status === "completed" ? (
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-card-foreground">
                {displayUserName}
              </h4>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[match.status]}`}>
                {match.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Learned <span className="font-medium text-primary">{skillILearned}</span> from <span className="font-medium text-foreground">{taughtBy}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-card-foreground truncate">
                {otherProfile?.name || "User"}
              </h4>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[match.status]}`}>
                {match.status}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{teacher1Name}</span> offered: <strong>{match.skill_offered}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{teacher2Name}</span> offered: <strong>{match.skill_requested}</strong>
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 ml-3">
        {match.status === "pending" && isIncoming && (
          <>
            <Button size="sm" variant="hero" onClick={() => onAccept?.(match.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject?.(match.id)}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {match.status === "accepted" && (
          <Button size="sm" variant="hero" onClick={() => onComplete?.(match.id)}>
            Mark Complete
          </Button>
        )}
        {match.status === "completed" && (
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete?.(match.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
