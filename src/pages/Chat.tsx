import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMatches } from "@/hooks/useMatches";
import { useAllProfiles } from "@/hooks/useProfile";
import ChatWindow from "@/components/ChatWindow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, MessageSquare, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: matches, isLoading: matchesLoading } = useMatches();
    const { data: allProfiles, isLoading: profilesLoading } = useAllProfiles();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleMarkAllRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from("messages")
            .update({ read: true })
            .eq("receiver_id", user.id)
            .eq("read", false);

        if (!error) {
            qc.invalidateQueries({ queryKey: ["unread-count", user.id] });
        }
    };

    if (matchesLoading || profilesLoading) return <div className="p-8 text-center">Loading chats...</div>;
    if (!user) return <div className="p-8 text-center">Please log in to chat.</div>;

    // Get users involved in accepted matches (active sessions)
    // Or maybe we allow chatting with anyone we're matched with?
    // Let's restrict to accepted or completed matches for now to prevent spam, 
    // OR allow any match interaction.
    // The prompt said "Coordinate sessions directly", so usually after match.
    const connectedUserIds = new Set(
        matches
            ?.filter((m) => m.status === "accepted" || m.status === "completed") // Only active connections
            .map((m) => (m.requester_id === user.id ? m.matched_user_id : m.requester_id))
    );

    const connectedProfiles = allProfiles?.filter((p) => connectedUserIds.has(p.user_id)) || [];

    const selectedProfile = connectedProfiles.find((p) => p.user_id === selectedUserId);

    return (
        <div className="container mx-auto h-[calc(100vh-5rem)] max-w-6xl py-6">
            <div className="grid h-full gap-6 lg:grid-cols-[300px_1fr]">

                {/* Sidebar List */}
                <div className="flex flex-col rounded-xl border bg-card shadow-card">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-display text-lg font-bold">Messages</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-8 text-[11px] text-muted-foreground hover:text-primary"
                        >
                            <CheckCheck className="mr-1 h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="space-y-1 p-2">
                            {connectedProfiles.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No active contacts.<br />Start a match to chat!
                                </div>
                            ) : (
                                connectedProfiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedUserId(profile.user_id)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent",
                                            selectedUserId === profile.user_id && "bg-accent"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={profile.avatar_url || ""} />
                                            <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <Link
                                                to={`/user/${profile.user_id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="truncate font-medium hover:text-primary transition-colors block"
                                            >
                                                {profile.name}
                                            </Link>
                                            <p className="truncate text-xs text-muted-foreground">
                                                Tap to chat
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex h-full flex-col">
                    {selectedUserId && selectedProfile ? (
                        <ChatWindow
                            otherUserId={selectedUserId}
                            otherUserName={selectedProfile.name}
                            otherUserAvatar={selectedProfile.avatar_url || ""}
                        />
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border bg-card/50 text-muted-foreground dashed border-dashed">
                            <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                            <p>Select a contact to start chatting</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
