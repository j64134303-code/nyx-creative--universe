
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-3.8-flash";
const TIMEOUT = 15000;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function systemPrompt(studioName: string) {
  return `You are NYX CORE, the central intelligence of NYX, a creative platform.

CURRENT STUDIO: ${studioName}

YOUR PURPOSE:
- Understand the creator's intention.
- Reason, plan and solve creative problems.
- Coordinate work across NYX studios.
- Preserve relevant project context.
- Help creators write, develop and improve ideas.
- Give useful, specific and thoughtful responses.

YOUR PERSONALITY:
- Warm, intelligent and natural.
- Emotionally aware without being intrusive.
- Direct without being rude.
- Creative, curious and practical.
- Use humour when appropriate.
- Adapt to the creator's mood.
- Ask only necessary questions.

IMPORTANT:
- Do not pretend to generate media or perform actions you have not performed.
- Do not invent research, facts or sources.
- Do not assume what the creator wants.
- Treat NYX as one connected creative universe.
- Give complete and useful answers.`;
}

function safeMessage(error: unknown): string {
  return error instanceof Error
    ? error.message.slice(0, 250)
    : "Unknown provider error";
}

async function askGroq(
  apiKey: string,
  system: string,
  history: Array<{ role: string; content: string }>,
  message: string,
): Promise<string> {
  const messages = [
    { role: "system", content: system },
    ...history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Groq HTTP ${response.status}: ${
        data?.error?.message || "Provider request failed"
      }`,
    );
  }

  const result = data?.choices?.[0]?.message?.content;

  if (typeof result !== "string" || !result.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return result.trim();
}

async function askGemini(
  apiKey: string,
  system: string,
  history: Array<{ role: string; content: string }>,
  message: string,
): Promise<string> {
  const contents = [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Gemini HTTP ${response.status}: ${
        data?.error?.message || "Provider request failed"
      }`,
    );
  }

  const result = data?.candidates?.[0]?.content?.parts
    ?.filter((part: any) =>
      typeof part.text === "string" && !part.thought
    )
    .map((part: any) => part.text)
    .join("\n")
    .trim();

  if (!result) {
    throw new Error("Gemini returned an empty response.");
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase authentication configuration is missing.");
    }

    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse({ error: "Invalid authentication." }, 401);
    }

    const body = await req.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return jsonResponse({ error: "A message is required." }, 400);
    }

    const studioName =
      typeof body.studioName === "string"
        ? body.studioName.slice(0, 100)
        : typeof body.studio === "string"
          ? body.studio.slice(0, 100)
          : "General Studio";

    const history = Array.isArray(body.history)
      ? body.history
          .filter((item: any) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-12)
          .map((item: any) => ({
            role: item.role,
            content: item.content.slice(0, 6000),
          }))
      : [];

    const system = systemPrompt(studioName);

    const groqKey = Deno.env.get("GROQ_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    console.log("NYX CORE provider availability:", {
      groq: Boolean(groqKey),
      gemini: Boolean(geminiKey),
      studio: studioName,
    });

    // Primary provider: Groq
    if (groqKey) {
      try {
        const answer = await askGroq(
          groqKey,
          system,
          history,
          message,
        );

        console.log("NYX CORE: Groq succeeded.");

        return jsonResponse({
          response: answer,
          provider: "groq",
          core: "NYX CORE",
        });
      } catch (error) {
        console.error("NYX CORE: Groq failed.", {
          message: safeMessage(error),
        });
      }
    }

    // Backup provider: Gemini
    if (geminiKey) {
      try {
        const answer = await askGemini(
          geminiKey,
          system,
          history,
          message,
        );

        console.log("NYX CORE: Gemini backup succeeded.");

        return jsonResponse({
          response: answer,
          provider: "gemini",
          core: "NYX CORE",
        });
      } catch (error) {
        console.error("NYX CORE: Gemini backup failed.", {
          message: safeMessage(error),
        });
      }
    }

    return jsonResponse({
      error: "NYX CORE could not reach either AI provider.",
    }, 502);

  } catch (error) {
    console.error("NYX CORE function error:", {
      message: safeMessage(error),
    });

    return jsonResponse({
      error: "NYX CORE encountered an internal error.",
    }, 500);
  }
});
