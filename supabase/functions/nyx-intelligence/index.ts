
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = "gemini-3.8-flash";
const GROQ_MODEL = "openai/gpt-oss-120b";
const PROVIDER_TIMEOUT = 20000;
const MAX_RETRIES = 1;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getGeminiText(result: any): string {
  return result?.candidates?.[0]?.content?.parts
    ?.filter(
      (part: any) =>
        typeof part.text === "string" && !part.thought
    )
    .map((part: any) => part.text)
    .join("\n")
    .trim() || "";
}

function getSafeError(data: any): string {
  return String(
    data?.error?.message ||
    data?.message ||
    "Unknown provider error."
  ).slice(0, 250);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    PROVIDER_TIMEOUT
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestProvider(
  provider: string,
  url: string,
  options: RequestInit
): Promise<any> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response: Response;

    try {
      response = await fetchWithTimeout(url, options);
    } catch (error) {
      console.error(`${provider} connection failed:`, {
        attempt: attempt + 1,
        message:
          error instanceof Error
            ? error.message.slice(0, 200)
            : "Connection error",
      });

      if (attempt < MAX_RETRIES) {
        await delay(700);
        continue;
      }

      throw new Error(`${provider} connection or timeout failure.`);
    }

    const raw = await response.text();
    let result: any;

    try {
      result = JSON.parse(raw);
    } catch {
      console.error(`${provider} returned invalid JSON.`, {
        status: response.status,
      });

      throw new Error(`${provider} returned an invalid response.`);
    }

    if (!response.ok) {
      console.error(`${provider} API error:`, {
        status: response.status,
        message: getSafeError(result),
        attempt: attempt + 1,
      });

      const temporaryFailure =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      if (temporaryFailure && attempt < MAX_RETRIES) {
        await delay(1000);
        continue;
      }

      throw new Error(
        `${provider} request failed with status ${response.status}.`
      );
    }

    return result;
  }

  throw new Error(`${provider} request failed.`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405
    );
  }

  try {
    // 1. Authenticate the user
    const authHeader =
      req.headers.get("Authorization") || "";

    const token = authHeader
      .replace(/^Bearer\s+/i, "")
      .trim();

    if (!token) {
      return jsonResponse(
        { error: "Please sign in to use NYX AI." },
        401
      );
    }

    // 2. Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !publishableKey) {
      return jsonResponse(
        { error: "NYX authentication configuration is missing." },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data, error } =
      await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("NYX authentication failed:", error?.message);

      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401
      );
    }

    // 3. Read and validate the request
    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid request body." },
        400
      );
    }

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const studioName = String(
      body.studioName ||
      body.studio ||
      "Creative Studio"
    ).slice(0, 100);

    if (!message) {
      return jsonResponse(
        { error: "Please enter a message." },
        400
      );
    }

    if (message.length > 12000) {
      return jsonResponse(
        { error: "Message is too long." },
        400
      );
    }

    // 4. Preserve conversation history
    const history = Array.isArray(body.history)
      ? body.history.slice(-12)
      : [];

    const validHistory = history.filter(
      (item: any) =>
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
    );

    const systemPrompt = `
You are NYX, an intelligent creative partner.

Current studio: ${studioName}

YOUR PERSONALITY:
- Warm, intelligent, natural and emotionally aware.
- Direct and thoughtful without being rude.
- Creative, curious and practical.
- Adapt your communication to the creator's mood and situation.
- Use humour naturally when appropriate.
- Be sensitive when the subject is serious.
- Avoid repetitive or robotic responses.

YOUR RESPONSIBILITIES:
- Understand the creator's intention before making assumptions.
- Help with creative thinking, planning, writing, editing and problem-solving.
- Give specific and useful answers.
- Ask only necessary follow-up questions.
- Challenge weak ideas constructively.
- Maintain conversation continuity.
- Coordinate creative thinking across NYX studios when relevant.
- Never pretend to have completed an action you have not performed.
- Never invent research, facts, sources or citations.
- Never claim to search, generate, edit or export media unless the relevant tool actually performed that action.

You are the central intelligence of NYX.
You should understand the creator's goals and help them move forward naturally.
`;

    // 5. Read provider secrets
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    console.log("NYX provider availability:", {
      gemini: Boolean(geminiKey),
      groq: Boolean(groqKey),
    });

    if (!geminiKey && !groqKey) {
      return jsonResponse(
        { error: "NYX AI providers are not configured." },
        500
      );
    }

    // 6. Prepare conversation for Gemini
    const geminiContents = [
      ...validHistory.map((item: any) => ({
        role:
          item.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: item.content.slice(0, 4000),
          },
        ],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // 7. Try Gemini first
    if (geminiKey) {
      try {
        console.log("NYX attempting primary provider: Gemini");

        const result = await requestProvider(
          "Gemini",
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: geminiContents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
              },
            }),
          }
        );

        const response = getGeminiText(result);

        if (!response) {
          throw new Error("Gemini returned an empty response.");
        }

        console.log("NYX response provider: Gemini");

        return jsonResponse({ response });
      } catch (error) {
        console.error("Gemini failed. Preparing fallback:", {
          message:
            error instanceof Error
              ? error.message
              : "Unknown Gemini failure",
        });

        if (!groqKey) {
          return jsonResponse(
            {
              error:
                "NYX's primary AI is temporarily unavailable. Please try again.",
            },
            502
          );
        }

        console.log("NYX switching to Groq backup.");
      }
    }

    // 8. Prepare conversation for Groq
    if (groqKey) {
      try {
        const groqMessages = [
          {
            role: "system",
            content: systemPrompt,
          },
          ...validHistory.map((item: any) => ({
            role:
              item.role === "assistant"
                ? "assistant"
                : "user",
            content: item.content.slice(0, 4000),
          })),
          {
            role: "user",
            content: message,
          },
        ];

        // 9. Try Groq
        console.log("NYX attempting backup provider: Groq");

        const result = await requestProvider(
          "Groq",
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: groqMessages,
              temperature: 0.7,
              max_completion_tokens: 3000,
            }),
          }
        );

        const response =
          result?.choices?.[0]?.message?.content?.trim() || "";

        if (!response) {
          throw new Error("Groq returned an empty response.");
        }

        console.log("NYX response provider: Groq backup");

        return jsonResponse({ response });
      } catch (error) {
        console.error("Groq backup failed:", {
          message:
            error instanceof Error
              ? error.message
              : "Unknown Groq failure",
        });

        return jsonResponse(
          {
            error:
              "NYX's AI providers are temporarily unavailable. Please try again.",
          },
          502
        );
      }
    }

    return jsonResponse(
      { error: "NYX AI is temporarily unavailable." },
      502
    );
  } catch (error) {
    console.error("NYX function error:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown function error",
    });

    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500
    );
  }
});
