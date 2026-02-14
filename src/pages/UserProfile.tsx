import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useProfile";
import SkillBadge from "@/components/SkillBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, Calendar, User as UserIcon } from "lucide-react";

export default function UserProfile() {
    const { userId } = useParams<{ userId: string }>();

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ["user-profile", userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId!)
                .maybeSingle();
            if (error) throw error;
            return data as Profile | null;
        },
    });

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
                <div className="animate-pulse text-center space-y-2">
                    <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
                    <div className="h-4 w-32 bg-muted rounded mx-auto" />
                    <div className="h-3 w-48 bg-muted rounded mx-auto" />
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
                <UserIcon className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <h1 className="font-display text-2xl font-bold text-foreground">User Not Found</h1>
                <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
                <Button variant="outline" asChild>
                    <Link to="/matches"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6 animate-slide-up">
            {/* Back button */}
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to={-1 as any} onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                </Link>
            </Button>

            {/* Profile Card */}
            <div className="rounded-xl border bg-card p-8 shadow-card space-y-6">
                {/* Header */}
                <div className="flex items-center gap-5">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="text-2xl">
                            <UserIcon className="h-8 w-8" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="font-display text-2xl font-bold text-card-foreground">
                            {profile.name || "Anonymous"}
                        </h1>
                        {profile.rating > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= Math.round(profile.rating)
                                                ? "fill-primary text-primary"
                                                : "text-muted-foreground/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {Number(profile.rating).toFixed(1)}
                                </span>
                            </div>
                        )}
                        {profile.completed_sessions > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {profile.completed_sessions} session{profile.completed_sessions !== 1 ? "s" : ""} completed
                            </p>
                        )}
                    </div>
                </div>
                {/* Gamification Stats */}
                <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <span>🪙</span>
                        <span>{profile.skill_credits || 0} Credits</span>
                    </div>
                    {(profile.skill_credits || 0) >= 100 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700 border border-yellow-200 shadow-sm">
                            <span>🏆</span>
                            <span>Top Mentor</span>
                        </div>
                    )}
                </div>


                {/* Bio */}
                {profile.bio && (
                    <div className="space-y-1.5">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
                        <p className="text-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                )}

                {/* Availability */}
                {profile.availability && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/20 p-4">
                        <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Availability</p>
                            <p className="text-sm text-foreground">{profile.availability}</p>
                        </div>
                    </div>
                )}

                {/* Skills Offered */}
                {profile.skills_offered && profile.skills_offered.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skills They Can Teach</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills_offered.map((s) => (
                                <SkillBadge key={s} skill={s} variant="offered" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills Wanted */}
                {profile.skills_wanted && profile.skills_wanted.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skills They Want to Learn</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills_wanted.map((s) => (
                                <SkillBadge key={s} skill={s} variant="wanted" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Member since */}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                    Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
            </div>
        </div >
    );
}
