import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Session } from "@/hooks/useSessions";

interface CompletedSessionCardProps {
    session: Session;
}

export default function CompletedSessionCard({ session }: CompletedSessionCardProps) {
    const learnerName = session.learner?.name || "Someone";
    const teacherName = session.teacher?.name || "Teacher";
    const skillName = session.skill_name;
    const date = session.session_date ? new Date(session.session_date) : new Date();

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm transition-all hover:bg-primary/10">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-display font-bold text-sm uppercase tracking-wider">Session Completed</span>
                </div>
                <span className="text-xs text-muted-foreground">{format(date, "d MMM yyyy")}</span>
            </div>

            <div className="mt-3">
                <p className="text-lg text-foreground leading-relaxed">
                    <span className="font-medium">{learnerName}</span> learned <strong className="text-primary">{skillName}</strong> from <span className="font-medium">{teacherName}</span>
                </p>
            </div>

            <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                    Date: {format(date, "d MMM yyyy")}
                </p>
            </div>
        </div>
    );
}
