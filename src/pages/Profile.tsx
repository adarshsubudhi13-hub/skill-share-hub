import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SkillBadge from "@/components/SkillBadge";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("");
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<string[]>([]);
  const [newOffered, setNewOffered] = useState("");
  const [newWanted, setNewWanted] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || "");
      setAvailability(profile.availability || "");
      setSkillsOffered(profile.skills_offered || []);
      setSkillsWanted(profile.skills_wanted || []);
    }
  }, [profile]);

  if (authLoading || isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" />;

  const addSkill = (type: "offered" | "wanted") => {
    const val = type === "offered" ? newOffered.trim() : newWanted.trim();
    if (!val) return;
    if (type === "offered") {
      if (!skillsOffered.includes(val)) setSkillsOffered([...skillsOffered, val]);
      setNewOffered("");
    } else {
      if (!skillsWanted.includes(val)) setSkillsWanted([...skillsWanted, val]);
      setNewWanted("");
    }
  };

  const handleSave = () => {
    updateProfile.mutate(
      {
        name,
        bio,
        availability,
        skills_offered: skillsOffered,
        skills_wanted: skillsWanted,
      },
      {
        onSuccess: () => toast({ title: "Profile updated!", description: "Your changes have been saved." }),
        onError: (err) => toast({ title: "Error saving profile", description: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Edit Profile</h1>
        <div className="flex items-center gap-2 rounded-full border bg-secondary/50 px-3 py-1">
          <span className="font-bold text-primary">{(profile?.skill_credits || 0)} 🪙</span>
          {(profile?.skill_credits || 0) >= 100 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 border border-yellow-200 shadow-sm flex items-center gap-1">
              🏆 Top Mentor
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-xl border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Availability</Label>
          <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g., Weekday evenings, Saturday mornings" />
        </div>

        {/* Skills Offered */}
        <div className="space-y-2">
          <Label>Skills I Can Teach</Label>
          <div className="flex gap-2">
            <Input
              value={newOffered}
              onChange={(e) => setNewOffered(e.target.value)}
              placeholder="e.g., JavaScript, Guitar"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("offered"))}
            />
            <Button type="button" size="icon" variant="outline" onClick={() => addSkill("offered")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsOffered.map((s) => (
              <SkillBadge key={s} skill={s} variant="offered" onRemove={() => setSkillsOffered(skillsOffered.filter((x) => x !== s))} />
            ))}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="space-y-2">
          <Label>Skills I Want to Learn</Label>
          <div className="flex gap-2">
            <Input
              value={newWanted}
              onChange={(e) => setNewWanted(e.target.value)}
              placeholder="e.g., Python, Photography"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("wanted"))}
            />
            <Button type="button" size="icon" variant="outline" onClick={() => addSkill("wanted")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsWanted.map((s) => (
              <SkillBadge key={s} skill={s} variant="wanted" onRemove={() => setSkillsWanted(skillsWanted.filter((x) => x !== s))} />
            ))}
          </div>
        </div>

        <Button variant="hero" onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
          {updateProfile.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
