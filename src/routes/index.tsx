import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPublic } from "@/lib/malami.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Send,
  Menu,
  Lock,
  GraduationCap,
  ClipboardCheck,
  BookMarked,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malami AI — Your Hausa, English & Pidgin study buddy" },
      {
        name: "description",
        content:
          "Malami AI is a free, friendly study assistant for Nigerian JSS and SSS students. Ask any question in Hausa, English or Pidgin — no signup needed to try.",
      },
      { property: "og:title", content: "Malami AI — Study buddy for JSS & SSS" },
      {
        property: "og:description",
        content:
          "Ask Malami AI your first question free in Hausa, English or Pidgin. Sign in to unlock Learn, Quizzes and Vocabulary.",
      },
    ],
  }),
  component: Landing,
});

type Turn = { role: "user" | "assistant"; content: string };

function Landing() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [askedOnce, setAskedOnce] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ask = useServerFn(askPublic);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    if (askedOnce) {
      toast.info("Create a free account to keep chatting and save your progress.");
      navigate({ to: "/auth" });
      return;
    }
    setTurns((t) => [...t, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { content } });
      setTurns((t) => [...t, { role: "assistant", content: reply }]);
      setAskedOnce(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const navLinks = (onClick?: () => void) => (
    <>
      <a
        href="#ask"
        onClick={onClick}
        className="text-sm font-medium text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400"
      >
        Ask
      </a>
      <a
        href="#features"
        onClick={onClick}
        className="text-sm font-medium text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400"
      >
        Features
      </a>
      <a
        href="#about"
        onClick={onClick}
        className="text-sm font-medium text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400"
      >
        About
      </a>
      <a
        href="#contact"
        onClick={onClick}
        className="text-sm font-medium text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400"
      >
        Contact
      </a>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/40">
      {/* Nav */}
      <header className="w-full border-b border-emerald-100/60 dark:border-emerald-900/40 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src="/malami-logo.png"
              alt="Malami AI"
              className="h-9 w-9 shrink-0 rounded-lg object-contain bg-black/90 p-1"
            />
            <span className="font-bold text-lg truncate">Malami AI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks()}
            {hasSession ? (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/app">Open app</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Link to="/auth">Create account</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-2">
            {hasSession ? (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/app">Open</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/auth">Login</Link>
              </Button>
            )}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img
                      src="/malami-logo.png"
                      alt=""
                      className="h-8 w-8 rounded-md object-contain bg-black/90 p-1"
                    />
                    Malami AI
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {navLinks(() => setMenuOpen(false))}
                  <div className="pt-4 border-t flex flex-col gap-2">
                    {hasSession ? (
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link to="/app" onClick={() => setMenuOpen(false)}>
                          Open app
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant="outline">
                          <Link to="/auth" onClick={() => setMenuOpen(false)}>
                            Login
                          </Link>
                        </Button>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                          <Link to="/auth" onClick={() => setMenuOpen(false)}>
                            Create account
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero + Ask */}
      <main className="flex-1">
        <section id="ask" className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 text-center">
          <img
            src="/malami-logo.png"
            alt=""
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain bg-black/90 p-2 shadow-lg"
          />
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Sannu! I am{" "}
            <span className="text-emerald-700 dark:text-emerald-400">Malami AI</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Your friendly study buddy for JSS & SSS. Ask me anything in{" "}
            <strong>Hausa</strong> or <strong>English</strong>.
          </p>

          {/* Ask box */}
          <form
            onSubmit={submit}
            className="mt-8 mx-auto max-w-2xl flex items-end gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-background shadow-lg p-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e as unknown as React.FormEvent);
                }
              }}
              placeholder={
                askedOnce
                  ? "Sign in to keep asking…"
                  : "Ask Malami AI… (Hausa or English)"
              }
              className="min-h-[56px] resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent"
              disabled={loading || askedOnce}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 h-11 w-11 shrink-0 rounded-xl"
              disabled={loading || !input.trim() || askedOnce}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Message area */}
          {(turns.length > 0 || loading) && (
            <div className="mt-6 mx-auto max-w-2xl text-left rounded-2xl border bg-background/70 p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={
                    t.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-emerald-600 text-white px-3 py-2 text-sm"
                      : "mr-auto max-w-[92%] rounded-2xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
                  }
                >
                  {t.content}
                </div>
              ))}
              {loading && (
                <div className="mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Malami is thinking…
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {askedOnce && (
            <div className="mt-6 mx-auto max-w-2xl rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-left">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Madalla! That was your free question.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Login or create a free account to keep chatting and unlock{" "}
                    <strong>Learn</strong>, <strong>Quizzes</strong> and{" "}
                    <strong>Vocabulary</strong>. Your chats and memories go dey saved.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Link to="/auth">Create free account</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/auth">Login</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Locked features */}
        <section id="features" className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <p className="text-center text-sm text-muted-foreground mb-4">
            {hasSession
              ? "Open the app to use these features"
              : "Login to unlock these features"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <FeatureTile
              icon={<GraduationCap className="h-5 w-5" />}
              title="Learn"
              desc="Guided subjects, step by step"
              locked={!hasSession}
              to={hasSession ? "/app" : "/auth"}
            />
            <FeatureTile
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Quizzes"
              desc="Test yourself and score"
              locked={!hasSession}
              to={hasSession ? "/app" : "/auth"}
            />
            <FeatureTile
              icon={<BookMarked className="h-5 w-5" />}
              title="Vocabulary"
              desc="Grow your words daily"
              locked={!hasSession}
              to={hasSession ? "/app" : "/auth"}
            />
          </div>
        </section>
      </main>

      {/* Footer — hidden for signed-in users */}
      {!hasSession && (
        <footer className="border-t bg-background/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/malami-logo.png"
                  alt=""
                  className="h-8 w-8 rounded-md object-contain bg-black/90 p-1"
                />
                <span className="font-semibold">Malami AI</span>
              </div>
              <p className="text-muted-foreground">
                A friendly Hausa, English & Pidgin study buddy for Nigerian JSS and SSS
                students.
              </p>
            </div>
            <div id="about">
              <h3 className="font-semibold mb-2">About the project</h3>
              <p className="text-muted-foreground">
                Malami AI is created for the{" "}
                <strong>3MTT Knowledge Showcase 2.0</strong> challenge.
              </p>
              <p className="text-muted-foreground mt-1">Malami AI v1.0</p>
            </div>
            <div id="contact">
              <h3 className="font-semibold mb-2">Built by</h3>
              <p className="text-muted-foreground">Salim Kabiru</p>
              <p className="text-muted-foreground">3MTT Fellow ID: FE/23/68144580</p>
              <p className="text-muted-foreground">Learning Track: AI/ML</p>
            </div>
          </div>
          <div className="border-t">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Malami AI · Made with care in Nigeria 🇳🇬
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  desc,
  locked,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  locked: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-2xl border bg-background/70 p-4 sm:p-5 hover:border-emerald-400 hover:shadow-md transition text-left flex items-start gap-3"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>
      </span>
    </Link>
  );
}
