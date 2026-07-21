import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPublic } from "@/lib/malami.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Sparkles, MessageCircle, GraduationCap, ClipboardCheck, BookMarked, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malami AI — Your Hausa, English & Pidgin study buddy" },
      {
        name: "description",
        content:
          "Malami AI is a free, friendly study assistant for Nigerian JSS and SSS students. Ask any question in Hausa, English or Pidgin — no signup needed to try.",
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
    // Allow only one free question; then prompt sign-up.
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/40">
      {/* Nav */}
      <header className="w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/malami-logo.jpg" alt="Malami AI" className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-semibold text-lg">Malami AI</span>
          </div>
          <nav className="flex items-center gap-2">
            {hasSession ? (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/app">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Link to="/auth">Create account</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero + try-it */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> For JSS & SSS students
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Sannu! I'm <span className="text-emerald-700 dark:text-emerald-400">Malami AI</span> — your study buddy.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
              Ask me anything from your school work in <strong>Hausa</strong>, <strong>English</strong> or{" "}
              <strong>Pidgin</strong>. I go break am down small small, with kindness. No wahala.
            </p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              <Feature icon={<MessageCircle className="h-4 w-4" />} title="Friendly chat" desc="Ask any subject" />
              <Feature icon={<GraduationCap className="h-4 w-4" />} title="Guided learning" desc="Step-by-step" />
              <Feature icon={<ClipboardCheck className="h-4 w-4" />} title="Quizzes" desc="Test yourself" />
              <Feature icon={<BookMarked className="h-4 w-4" />} title="Vocabulary" desc="Grow your words" />
            </ul>
          </div>

          {/* Try-it card */}
          <Card className="p-4 sm:p-5 shadow-xl border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-2 mb-3">
              <img src="/malami-logo.jpg" alt="" className="h-8 w-8 rounded-md object-cover" />
              <div className="text-sm">
                <div className="font-semibold">Try Malami AI free</div>
                <div className="text-xs text-muted-foreground">Ask your first question — no signup needed</div>
              </div>
            </div>

            <div className="h-72 sm:h-80 overflow-y-auto rounded-md border bg-background/60 p-3 space-y-3">
              {turns.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Sample questions to try:</p>
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Explain photosynthesis in simple English</li>
                    <li>Yaya ake warware simple equation 2x + 3 = 11?</li>
                    <li>Wetin be the difference between weather and climate?</li>
                  </ul>
                </div>
              )}
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={
                    t.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-emerald-600 text-white px-3 py-2 text-sm"
                      : "mr-auto max-w-[90%] rounded-2xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
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

            {askedOnce ? (
              <div className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                  <div className="flex-1">
                    <p className="font-medium">Madalla! That was your free question.</p>
                    <p className="text-muted-foreground mt-1">
                      Create a free account to keep chatting, save your history, take quizzes and build your vocabulary.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Link to="/auth">Create free account</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/auth">Sign in</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-3 flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Type your question…"
                  className="min-h-[52px] resize-none"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-emerald-600 hover:bg-emerald-700 h-[52px] w-12 shrink-0"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/malami-logo.jpg" alt="" className="h-8 w-8 rounded-md object-cover" />
              <span className="font-semibold">Malami AI</span>
            </div>
            <p className="text-muted-foreground">
              A friendly Hausa, English & Pidgin study buddy for Nigerian JSS and SSS students.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">About the project</h3>
            <p className="text-muted-foreground">
              Malami AI is created for the <strong>3MTT Knowledge Showcase 2.0</strong> challenge.
            </p>
            <p className="text-muted-foreground mt-1">Malami AI v1.0</p>
          </div>
          <div>
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
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border bg-background/60 p-3">
      <span className="mt-0.5 text-emerald-700 dark:text-emerald-400">{icon}</span>
      <span>
        <span className="font-medium block">{title}</span>
        <span className="text-muted-foreground text-xs">{desc}</span>
      </span>
    </li>
  );
}
