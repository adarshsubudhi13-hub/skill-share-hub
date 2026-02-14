import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ArrowRightLeft, Users, Star, BookOpen, MessageSquare, Zap, MoveRight, Layers, Target, Compass } from "lucide-react";

const features = [
  { icon: ArrowRightLeft, title: "Skill Exchange", desc: "Trade your expertise for new knowledge — no money involved." },
  { icon: Users, title: "Smart Matching", desc: "Our algorithm finds the perfect skill swap partners for you." },
  { icon: Star, title: "Ratings & Reviews", desc: "Build your reputation through quality teaching sessions." },
  { icon: BookOpen, title: "Diverse Skills", desc: "From coding to cooking, languages to art — swap anything." },
  { icon: Zap, title: "Instant Connect", desc: "Request a swap and start learning within minutes." },
  { icon: MessageSquare, title: "Built-in Chat", desc: "Coordinate sessions directly with your swap partner." },
];

const categories = ["💻 Tech", "🎨 Arts", "⚽ Sports", "🌍 Languages", "📚 Academics", "🎵 Music"];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="bg-grid relative border-b border-border pb-24 pt-32 transition-colors">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-slide-up mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/80">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Peer-to-Peer Knowledge Exchange
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight sm:text-7xl">
              Learn by Teaching. <br />
              <span className="text-primary italic">Teach by Learning.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Welcome to SkillSwap - The platform that connects people who want to learn new skills with those who can teach them. <br />
              No money needed — just your knowledge.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Button variant="hero" size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90" asChild>
                    <Link to="/register">Start Swapping</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-14 px-8 border-border bg-card hover:bg-secondary/50" asChild>
                    <Link to="/login">I Have an Account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-secondary/30 py-8 transition-colors">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4">
          {categories.map((cat) => (
            <span key={cat} className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-white">
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Original Features Grid - Styled with New Design */}
      <section className="bg-background py-24 text-foreground transition-colors">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center space-y-4">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Everything you need to grow</h2>
            <p className="text-muted-foreground">A simple, powerful system to connect learners and teachers.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="flex gap-6 p-6 rounded-2xl transition-all hover:bg-secondary/50 border border-transparent hover:border-border">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
                  <f.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold leading-tight">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 border-y border-border bg-background transition-colors" id="how-it-works">
        <div className="container mx-auto px-4 space-y-20">
          <div className="text-center">
            <h2 className="font-display inline-block bg-yellow-highlight text-3xl sm:text-4xl px-6 py-2">
              How does it work?
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-4">
            {/* Step 1: Choose what you want */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Choose what you want</h3>
              <div className="mx-auto w-full max-w-[240px] rounded-[32px] border-[6px] border-secondary bg-background p-4 shadow-2xl h-[420px] relative overflow-hidden">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">What are you looking for?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Arts & Design", "Beauty & Hair", "Business", "Cleaning", "Cooking", "DIY", "Education", "Fitness"].map((cat) => (
                      <div key={cat} className="rounded-lg bg-primary/10 p-2 text-[10px] font-medium border border-primary/20 text-center">
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Offer your skills */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Offer your skills</h3>
              <div className="mx-auto w-full max-w-[240px] rounded-[32px] border-[6px] border-secondary bg-background shadow-2xl h-[420px] relative overflow-hidden">
                <div className="h-32 bg-primary/20 flex items-center justify-center">
                  <Layers className="h-10 w-10 text-primary" />
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-bold text-primary uppercase">Tech & Digital</p>
                  <h4 className="text-sm font-bold leading-tight">Website design and Wordpress handover</h4>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-secondary" />
                    <p className="text-[10px] text-muted-foreground font-medium">Offered by Carolina</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2 w-2 fill-primary text-primary" />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Find the right match */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Find the right match</h3>
              <div className="mx-auto w-full max-w-[240px] rounded-[32px] border-[6px] border-secondary bg-background shadow-2xl h-[420px] relative overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div className="h-2 w-20 bg-muted rounded-full" />
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="aspect-square rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Users className="h-10 w-10 text-primary/50" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-bold">Hannah</p>
                      <p className="text-[10px] text-muted-foreground">Milano, Italy</p>
                    </div>
                    <Button size="sm" className="w-full text-[10px] h-7 bg-primary">See profile</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Let the barter begin! */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Let the barter begin!</h3>
              <div className="mx-auto w-full max-w-[240px] rounded-[32px] border-[6px] border-secondary bg-background shadow-2xl h-[420px] relative overflow-hidden flex flex-col">
                <div className="border-b bg-card p-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center"><Users className="h-3 w-3" /></div>
                  <p className="text-[10px] font-bold">Patrizia P.</p>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="max-w-[80%] rounded-lg bg-secondary/30 p-2 text-[10px] ml-auto">
                    Hi! Let's swap yoga for design.
                  </div>
                  <div className="max-w-[80%] rounded-lg bg-primary/20 p-2 text-[10px]">
                    Great idea! When are you free?
                  </div>
                </div>
                <div className="p-3 mt-auto border-t bg-card">
                  <div className="h-6 w-full rounded-full border border-border px-3 text-[10px] flex items-center text-muted-foreground">Write a message...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-24 text-center text-foreground border-t border-border transition-colors">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Ready to start swapping skills?</h2>
          <p className="text-muted-foreground">Join hundreds of people already learning and teaching on SkillSwap.</p>
          <div className="mx-auto flex max-w-sm flex-col gap-4">
            <Button size="lg" className="h-14 w-full bg-primary hover:bg-primary/90 text-lg font-bold" asChild>
              <Link to={user ? "/dashboard" : "/register"}>
                {user ? "Back to Dashboard" : "Get Started Now"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-16 text-sm text-muted-foreground border-t border-border transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-foreground">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
                SkillSwap
              </div>
              <p>The premium peer-to-peer knowledge exchange platform. <br /> Connect with us at help@skillswap.com</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <p>© 2026 SkillSwap (Official). All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
