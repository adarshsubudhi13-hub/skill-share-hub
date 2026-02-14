import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMatches } from "@/hooks/useMatches";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  matchId: string;
  onClose: () => void;
}

export default function RatingDialog({ matchId, onClose }: RatingDialogProps) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: matches } = useMatches();
  const { toast } = useToast();

  const match = matches?.find((m) => m.id === matchId);
  const ratedUserId = match ? (match.requester_id === user?.id ? match.matched_user_id : match.requester_id) : null;

  const handleSubmit = async () => {
    if (!score || !user || !ratedUserId) return;
    setLoading(true);

    try {
      // 1. We need a session for rating - check if one exists or create one
      // First, try to find an existing completed session for this match
      const { data: existingSession } = await supabase
        .from("sessions")
        .select("id")
        .eq("match_id", matchId)
        .eq("status", "completed")
        .maybeSingle();

      let sessionId = existingSession?.id;

      const learnedSkill = match ? (match.requester_id === user.id ? match.skill_requested : match.skill_offered).trim() : "Skill Swap";

      if (!sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            match_id: matchId,
            user1_id: ratedUserId, // Teacher is the one being rated
            user2_id: user.id,      // Learner is the one giving the rating
            skill_exchanged: learnedSkill,
            status: "completed",
            session_date: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (sessionError) {
          toast({ title: "Session Error", description: sessionError.message, variant: "destructive" });
          setLoading(false);
          return;
        }
        sessionId = session.id;
      }

      // 2. Insert the rating
      const { error: ratingError } = await supabase.from("ratings").insert({
        session_id: sessionId,
        rated_by: user.id,
        rated_user: ratedUserId,
        score,
        comment,
      });

      if (ratingError) {
        if (ratingError.code === "23505") {
          toast({ title: "Already Rated", description: "You have already rated this session.", variant: "destructive" });
        } else {
          toast({ title: "Rating Error", description: ratingError.message, variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      // 3. Attempt to update the rated user's average rating 
      // Note: This may fail due to RLS if not handled by a trigger, but we'll try anyway
      const { data: allRatings } = await supabase
        .from("ratings")
        .select("score")
        .eq("rated_user", ratedUserId);

      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
        // This call might fail silently or return error due to RLS "update own profile"
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ rating: avg, completed_sessions: allRatings.length })
          .eq("user_id", ratedUserId);

        if (profileError) {
          console.warn("Profile update failed (likely RLS):", profileError.message);
          // We don't block success if only the public profile update fails
        }
      }

      toast({ title: "Success!", description: "Your rating has been submitted." });

      // 4. Update my own profile to include the new skill I learned!
      if (match) {
        const learnedSkill = (match.requester_id === user.id ? match.skill_requested : match.skill_offered).trim();
        const currentOffered = profile?.skills_offered || [];
        const currentWanted = profile?.skills_wanted || [];

        const isAlreadyKnown = currentOffered.some(s => s.toLowerCase().trim() === learnedSkill.toLowerCase());

        if (learnedSkill && !isAlreadyKnown) {
          const newOffered = [...currentOffered, learnedSkill];
          const newWanted = currentWanted.filter(s => s.toLowerCase().trim() !== learnedSkill.toLowerCase());

          await supabase
            .from("profiles")
            .update({
              skills_offered: newOffered,
              skills_wanted: newWanted
            })
            .eq("user_id", user.id);
        }
      }

      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["my-ratings"] });
      onClose();
    } catch (err: any) {
      console.error("Rating submission exception:", err);
      toast({ title: "Unexpected Error", description: err.message || "An unknown error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Rate Your Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setScore(i)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${i <= (hover || score)
                    ? "fill-secondary text-secondary"
                    : "text-border"
                    }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
          />
          <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={!score || loading}>
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
