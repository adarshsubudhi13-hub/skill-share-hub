import { X } from "lucide-react";

interface SkillBadgeProps {
  skill: string;
  onRemove?: () => void;
  variant?: "offered" | "wanted" | "neutral";
}

export default function SkillBadge({ skill, onRemove, variant = "neutral" }: SkillBadgeProps) {
  const colors = {
    offered: "bg-accent text-accent-foreground",
    wanted: "bg-accent text-accent-foreground",
    neutral: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${colors[variant]}`}>
      {skill}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
