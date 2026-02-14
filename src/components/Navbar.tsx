import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { ArrowRightLeft, LogOut, User, LayoutDashboard, MessageSquare, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: unreadCount } = useUnreadCount();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          SkillSwap
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 transition-all" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem] text-primary transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "relative hidden sm:flex",
                  isActive("/chat") && "bg-primary/10 text-primary"
                )}
              >
                <Link to="/chat">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Messages
                  {unreadCount && unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  isActive("/dashboard") && "bg-primary/10 text-primary"
                )}
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  isActive("/profile") && "bg-primary/10 text-primary"
                )}
              >
                <Link to="/profile">
                  <User className="mr-1.5 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  isActive("/login") && "bg-primary/10 text-primary"
                )}
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
