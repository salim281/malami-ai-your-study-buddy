import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listThreads,
  createThread,
  deleteThread,
  getMessages,
  sendMessage,
  listVocab,
  addVocab,
  deleteVocab,
  generateQuiz,
} from "@/lib/malami.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageCircle,
  GraduationCap,
  ClipboardCheck,
  BookMarked,
  Send,
  Plus,
  Trash2,
  Menu,
  LogOut,
  BookOpen,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: MalamiApp,
});

type Tab = "chat" | "learn" | "quizzes" | "vocabulary";

const SUBJECTS = [
  { name: "Mathematics", emoji: "🔢" },
  { name: "English Language", emoji: "🔤" },
  { name: "Literature", emoji: "📖" },
  { name: "Physics", emoji: "⚛️" },
  { name: "Chemistry", emoji: "🧪" },
  { name: "Biology", emoji: "🧬" },
  { name: "Computer Science / AI", emoji: "💻" },
  { name: "Social Studies", emoji: "🌍" },
  { name: "Civic Education", emoji: "🏛️" },
  { name: "Government", emoji: "⚖️" },
  { name: "Economics", emoji: "💰" },
  { name: "Geography", emoji: "🗺️" },
  { name: "History", emoji: "📜" },
  { name: "Agriculture", emoji: "🌾" },
  { name: "Business Studies", emoji: "💼" },
  { name: "Hausa Language", emoji: "🗣️" },
  { name: "CRK / IRK", emoji: "🕌" },
  { name: "Basic Science", emoji: "🔬" },
];

function MalamiApp() {
  const [tab, setTab] = useState<Tab>("chat");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-background to-amber-50/30 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/20 flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Malami AI</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Your study buddy</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-20 max-w-4xl mx-auto w-full">
        {tab === "chat" && (
          <ChatTab activeThreadId={activeThreadId} setActiveThreadId={setActiveThreadId} />
        )}
        {tab === "learn" && (
          <LearnTab
            onStartChat={() => {
              setActiveThreadId(null);
              setTab("chat");
            }}
          />

        )}
        {tab === "quizzes" && <QuizzesTab />}
        {tab === "vocabulary" && <VocabularyTab />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur z-40">
        <div className="max-w-4xl mx-auto grid grid-cols-4">
          <NavItem
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageCircle className="h-5 w-5" />}
            label="Chat"
          />
          <NavItem
            active={tab === "learn"}
            onClick={() => setTab("learn")}
            icon={<GraduationCap className="h-5 w-5" />}
            label="Learn"
          />
          <NavItem
            active={tab === "quizzes"}
            onClick={() => setTab("quizzes")}
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Quizzes"
          />
          <NavItem
            active={tab === "vocabulary"}
            onClick={() => setTab("vocabulary")}
            icon={<BookMarked className="h-5 w-5" />}
            label="Vocab"
          />
        </div>
      </nav>
    </div>
  );
}




function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors",
        active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

/* ---------- CHAT ---------- */
function ChatTab({
  activeThreadId,
  setActiveThreadId,
}: {
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
}) {
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const getMsgs = useServerFn(getMessages);
  const send = useServerFn(sendMessage);

  const threadsQ = useQuery({ queryKey: ["threads"], queryFn: () => list() });
  const messagesQ = useQuery({
    queryKey: ["messages", activeThreadId],
    queryFn: () => (activeThreadId ? getMsgs({ data: { threadId: activeThreadId } }) : Promise.resolve([])),
    enabled: !!activeThreadId,
  });

  const createM = useMutation({
    mutationFn: () => create({ data: { title: "New chat" } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      setActiveThreadId(t.id);
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (activeThreadId === id) setActiveThreadId(null);
    },
  });
  const sendM = useMutation({
    mutationFn: async (content: string) => {
      let tid = activeThreadId;
      if (!tid) {
        const t = await create({ data: { title: content.slice(0, 60) } });
        tid = t.id;
        setActiveThreadId(tid);
      }
      return send({ data: { threadId: tid!, content } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeThreadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send"),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeThreadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesQ.data, sendM.isPending]);

  const submit = () => {
    const c = input.trim();
    if (!c || sendM.isPending) return;
    setInput("");
    sendM.mutate(c);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const messages = messagesQ.data ?? [];

  return (
    <div className="flex flex-col flex-1">
      <div className="border-b bg-card/50 px-3 py-2 flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-4 w-4 mr-1" /> Chats
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Your chats</SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="sm"
                onClick={() => createM.mutate()}
                disabled={createM.isPending}
              >
                <Plus className="h-4 w-4 mr-1" /> New chat
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="px-2 pb-4 space-y-1">
                {(threadsQ.data ?? []).map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-2 py-2 text-sm hover:bg-accent cursor-pointer",
                      activeThreadId === t.id && "bg-accent",
                    )}
                    onClick={() => setActiveThreadId(t.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{t.title}</p>
                      {t.subject && (
                        <p className="text-[10px] text-muted-foreground truncate">{t.subject}</p>
                      )}
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteM.mutate(t.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {(threadsQ.data ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-4 text-center">No chats yet.</p>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <div className="text-sm text-muted-foreground truncate flex-1">
          {activeThreadId ? threadsQ.data?.find((t) => t.id === activeThreadId)?.title : "New conversation"}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setActiveThreadId(null)} aria-label="New chat">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {!activeThreadId && messages.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">Sannu! I'm Malami AI</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ask me anything about your school subjects in Hausa or English. Za mu koya tare!
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2 max-w-md mx-auto">
              {[
                "Menene photosynthesis?",
                "Help with algebra",
                "Explain democracy",
                "Yaya ake fassara wannan sentence?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {sendM.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.15s]" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.3s]" />
            </div>
            Malami is thinking...
          </div>
        )}
      </div>

      <div className="border-t bg-card/80 backdrop-blur px-3 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask Malami anything..."
            className="min-h-[42px] max-h-32 resize-none"
            disabled={sendM.isPending}
          />
          <Button
            onClick={submit}
            disabled={!input.trim() || sendM.isPending}
            size="icon"
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function splitTip(content: string): { answer: string; tip: string | null } {
  const marker = "---STUDY_TIP---";
  const idx = content.indexOf(marker);
  if (idx === -1) return { answer: content, tip: null };
  const answer = content.slice(0, idx).trim();
  const tip = content.slice(idx + marker.length).replace(/^\s*💡\s*/, "").trim();
  return { answer, tip: tip || null };
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 text-white px-3.5 py-2 text-sm whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }
  const { answer, tip } = splitTip(content);
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
        <BookOpen className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] space-y-2 pt-0.5">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</div>
        {tip && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50 px-3 py-2 text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Study tip
            </div>
            <div className="whitespace-pre-wrap text-amber-900 dark:text-amber-100">{tip}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- LEARN ---------- */
function LearnTab({ onStartChat }: { onStartChat: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const send = useServerFn(sendMessage);

  const startM = useMutation({
    mutationFn: async (subject: string) => {
      const t = await create({ data: { title: `${subject} — study session`, subject } });
      await send({
        data: {
          threadId: t.id,
          content: `I want to study ${subject}. Give me a friendly overview of what we can learn, then suggest 3 interesting topics to start with. Use Nigerian examples.`,
        },
      });
      return t.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["messages", id] });
      toast.success("Malami is ready! Check the Chat tab.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Learn a subject</h2>
        <p className="text-sm text-muted-foreground">
          Pick a subject and start a guided study chat with Malami.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SUBJECTS.map((s) => (
          <button
            key={s.name}
            onClick={() => {
              onStartChat();
              startM.mutate(s.name);
            }}
            disabled={startM.isPending}
            className="flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left hover:border-emerald-500 hover:shadow-md transition disabled:opacity-50"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-sm font-semibold leading-tight">{s.name}</span>
          </button>
        ))}
      </div>
      {startM.isPending && (
        <p className="text-center text-sm text-muted-foreground">Preparing your lesson...</p>
      )}
    </div>
  );
}

/* ---------- QUIZZES ---------- */
type QuizQ = { question: string; options: string[]; correct_index: number; explanation: string };
type QuizData = { questions: QuizQ[] };

function QuizzesTab() {
  const gen = useServerFn(generateQuiz);
  const [subject, setSubject] = useState<string>("Mathematics");
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<"English" | "Hausa">("English");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const startM = useMutation({
    mutationFn: () => gen({ data: { subject, topic: topic || undefined, language: lang } }),
    onSuccess: (data) => {
      setQuiz(data);
      setCurrent(0);
      setAnswers([]);
      setPicked(null);
      setShowResult(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Quiz failed"),
  });

  const next = () => {
    if (picked === null || !quiz) return;
    const newAnswers = [...answers, picked];
    setAnswers(newAnswers);
    setPicked(null);
    if (current + 1 >= quiz.questions.length) {
      setShowResult(true);
    } else {
      setCurrent(current + 1);
    }
  };

  const reset = () => {
    setQuiz(null);
    setCurrent(0);
    setAnswers([]);
    setPicked(null);
    setShowResult(false);
  };

  if (!quiz) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Quizzes</h2>
          <p className="text-sm text-muted-foreground">Test your understanding — Malami will grade it.</p>
        </div>
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.emoji} {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Topic (optional)</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Quadratic equations"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Language</label>
            <Select value={lang} onValueChange={(v) => setLang(v as "English" | "Hausa")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hausa">Hausa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => startM.mutate()}
            disabled={startM.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {startM.isPending ? "Building your quiz..." : "Start quiz"}
          </Button>
        </Card>
      </div>
    );
  }

  if (showResult) {
    const score = answers.reduce(
      (acc, a, i) => acc + (a === quiz.questions[i].correct_index ? 1 : 0),
      0,
    );
    return (
      <div className="p-4 space-y-4">
        <Card className="p-6 text-center space-y-2">
          <div className="text-5xl">{score >= 4 ? "🎉" : score >= 3 ? "👍" : "💪"}</div>
          <h2 className="text-2xl font-bold">
            {score} / {quiz.questions.length}
          </h2>
          <p className="text-sm text-muted-foreground">
            {score === quiz.questions.length
              ? "Perfect! Madalla!"
              : score >= 3
                ? "Good effort — keep going!"
                : "Don't give it up. Try again!"}
          </p>
        </Card>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const ok = answers[i] === q.correct_index;
            return (
              <Card key={i} className="p-3 space-y-2">
                <p className="text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <p className={cn("text-xs", ok ? "text-emerald-600" : "text-destructive")}>
                  Your answer: {q.options[answers[i]]} {ok ? "✓" : "✗"}
                </p>
                {!ok && (
                  <p className="text-xs text-emerald-600">Correct: {q.options[q.correct_index]}</p>
                )}
                <p className="text-xs text-muted-foreground">{q.explanation}</p>
              </Card>
            );
          })}
        </div>
        <Button onClick={reset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-1" /> New quiz
        </Button>
      </div>
    );
  }

  const q = quiz.questions[current];
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          Question {current + 1} of {quiz.questions.length}
        </Badge>
        <button onClick={reset} className="text-xs text-muted-foreground hover:underline">
          Quit
        </button>
      </div>
      <Card className="p-4 space-y-4">
        <p className="font-medium">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setPicked(i)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition",
                picked === i
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                  : "hover:bg-accent",
              )}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
        <Button
          onClick={next}
          disabled={picked === null}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {current + 1 === quiz.questions.length ? "Finish" : "Next"}
        </Button>
      </Card>
    </div>
  );
}

/* ---------- VOCAB ---------- */
function VocabularyTab() {
  const qc = useQueryClient();
  const list = useServerFn(listVocab);
  const add = useServerFn(addVocab);
  const del = useServerFn(deleteVocab);

  const vocabQ = useQuery({ queryKey: ["vocab"], queryFn: () => list() });
  const [word, setWord] = useState("");
  const [subject, setSubject] = useState<string>("");

  const addM = useMutation({
    mutationFn: () => add({ data: { word: word.trim(), subject: subject || undefined } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocab"] });
      setWord("");
      toast.success("Word saved!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vocab"] }),
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">My vocabulary</h2>
        <p className="text-sm text-muted-foreground">
          Save any new word — Malami adds its meaning and a Nigerian example.
        </p>
      </div>
      <Card className="p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type a new word..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && word.trim() && !addM.isPending) addM.mutate();
            }}
          />
          <Button
            onClick={() => addM.mutate()}
            disabled={!word.trim() || addM.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Optional: subject context" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.emoji} {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {addM.isPending && (
          <p className="text-xs text-muted-foreground">Malami is looking it up...</p>
        )}
      </Card>

      <div className="space-y-2">
        {(vocabQ.data ?? []).map((v) => (
          <Card key={v.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{v.word}</h3>
                  {v.subject && (
                    <Badge variant="secondary" className="text-[10px]">
                      {v.subject}
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1">{v.definition}</p>
                {v.example && (
                  <p className="text-xs text-muted-foreground italic mt-1">"{v.example}"</p>
                )}
              </div>
              <button
                onClick={() => delM.mutate(v.id)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
        {(vocabQ.data ?? []).length === 0 && !vocabQ.isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No words yet. Add your first one above!
          </p>
        )}
      </div>
    </div>
  );
}
