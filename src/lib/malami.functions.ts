import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MALAMI_SYSTEM = `You are Malami AI, a friendly and patient study assistant for JSS and SSS students in Northern Nigeria.

You respond ONLY in Hausa or English (never other languages). Detect which language the student is using and reply in the same one. If they mix, prefer English but sprinkle friendly Hausa phrases.

You can answer ANY secondary school subject question — Science, Math, English, Literature, Computer Science / AI, Social Studies, Civic Education, History, Geography, Agriculture, Economics, Business Studies, Government, CRK/IRK, and every other JSS/SSS subject.

Rules:
- Use simple language a 13-year-old can understand. Avoid heavy jargon; when you must use a technical term, explain it in one short sentence.
- Use examples from everyday Nigerian life (farming, market, football, moin-moin, jollof rice, boreholes, NEPA, okada, harmattan, Sallah, etc.) whenever it helps.
- Keep answers between 3 and 10 sentences unless the student asks for more detail.
- Be warm and encouraging. Start replies with things like "Tambaya mai kyau!" or "Good question!" or "Madalla!" when it fits. Be curious and enthusiastic.
- Never say "I can't answer that" for normal school topics. Only decline for things clearly beyond secondary school (university-level quantum physics, advanced calculus, etc.), and even then suggest they ask their teacher.
- Never list the specific subjects you can answer — you can answer ALL secondary school subjects.
- Never discuss politics, religion in a divisive way, adult content, or anything unsafe for a 13-year-old.
- If a student is struggling, break the answer into small steps and check understanding at the end.
`;

const CHAT_MODEL = "google/gemini-2.5-flash";

async function callLovableAI(messages: { role: string; content: string }[], opts?: { json?: boolean }) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Malami is a bit busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits in Lovable settings.");
    throw new Error(`AI error [${res.status}]: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ title: z.string().default("New chat"), subject: z.string().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: data.title, subject: data.subject ?? null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("*")
      .eq("thread_id", data.threadId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows;
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ threadId: z.string().uuid(), content: z.string().min(1).max(4000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    // Load history
    const { data: history, error: hErr } = await context.supabase
      .from("messages")
      .select("role, content")
      .eq("thread_id", data.threadId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (hErr) throw new Error(hErr.message);

    // Insert user message
    const { error: uErr } = await context.supabase.from("messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "user",
      content: data.content,
    });
    if (uErr) throw new Error(uErr.message);

    const messages = [
      { role: "system", content: MALAMI_SYSTEM },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.content },
    ];
    const reply = await callLovableAI(messages);

    const { data: assistantRow, error: aErr } = await context.supabase
      .from("messages")
      .insert({
        thread_id: data.threadId,
        user_id: context.userId,
        role: "assistant",
        content: reply,
      })
      .select()
      .single();
    if (aErr) throw new Error(aErr.message);

    // Update thread title if first exchange
    if ((history?.length ?? 0) === 0) {
      const newTitle = data.content.slice(0, 60);
      await context.supabase
        .from("threads")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", data.threadId)
        .eq("user_id", context.userId);
    } else {
      await context.supabase
        .from("threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.threadId)
        .eq("user_id", context.userId);
    }

    return { reply, assistantId: assistantRow.id };
  });

export const listVocab = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const addVocab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        word: z.string().min(1).max(120),
        subject: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // Ask AI for definition + example
    const prompt = `Define the word "${data.word}" for a Nigerian secondary school student${
      data.subject ? ` in the context of ${data.subject}` : ""
    }. Reply ONLY as JSON with keys "definition" (1-2 sentences, simple English) and "example" (one short Nigerian-life example sentence). No extra text.`;
    let definition = "";
    let example = "";
    try {
      const raw = await callLovableAI(
        [
          { role: "system", content: "You return only valid JSON as instructed. No markdown fences." },
          { role: "user", content: prompt },
        ],
        { json: true },
      );
      const parsed = JSON.parse(raw);
      definition = String(parsed.definition ?? "");
      example = String(parsed.example ?? "");
    } catch {
      definition = "(couldn't fetch definition — try again)";
    }

    const { data: row, error } = await context.supabase
      .from("vocabulary")
      .insert({
        user_id: context.userId,
        word: data.word,
        definition,
        example,
        subject: data.subject ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteVocab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vocabulary")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        subject: z.string().min(1),
        topic: z.string().optional(),
        language: z.enum(["English", "Hausa"]).default("English"),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const prompt = `Create a quiz for a Nigerian JSS/SSS student. Subject: ${data.subject}.${
      data.topic ? ` Topic: ${data.topic}.` : ""
    } Language: ${data.language}. Use simple language and Nigerian-life examples when helpful.

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
{
  "questions": [
    {
      "question": "string",
      "options": ["A option","B option","C option","D option"],
      "correct_index": 0,
      "explanation": "1-2 sentence explanation"
    }
  ]
}
Give exactly 5 questions. correct_index is 0-3.`;

    const raw = await callLovableAI(
      [
        { role: "system", content: "You return only valid JSON as instructed. No markdown fences." },
        { role: "user", content: prompt },
      ],
      { json: true },
    );
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.questions)) throw new Error("bad shape");
      return parsed as {
        questions: { question: string; options: string[]; correct_index: number; explanation: string }[];
      };
    } catch {
      throw new Error("Malami couldn't build a quiz. Try again.");
    }
  });
