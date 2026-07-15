import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Malami AI" },
      { name: "description", content: "Sign in to Malami AI, your Hausa & English study buddy for JSS and SSS." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Sannu da zuwa! Account created.");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Barka da dawowa!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <BookOpen className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Malami AI</CardTitle>
          <CardDescription>
            Your Hausa &amp; English study buddy for every JSS and SSS subject.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
            Continue with Google
          </Button>
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-card px-2 relative z-10">or</span>
            <div className="absolute left-0 right-0 top-1/2 border-t" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amina" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to Malami AI?"}{" "}
            <button
              type="button"
              className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
