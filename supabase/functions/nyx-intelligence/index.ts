
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getText(result: any): string {
  return result?.candidates?.[0]?.content?.parts
    ?.filter((part: any) =>
      typeof part.text === "string" && !part.thought
    )
    .map((part: any) => part.text)
    .join("\n")
    .trim() || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

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
      console.error("Authentication failed:", error?.message);

      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401
      );
    }

    // 3. Read the request
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
      body.studioName || body.studio || "Creative Studio"
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

    const validHistory = history.filter((item: any) =>
      ["user", "assistant"].includes(item.role) &&
      typeof item.content === "string"
    );

    const conversation = validHistory
      .map((item: any) =>
        `${item.role === "user" ? "Creator" : "NYX"}: ${
          item.content.slice(0, 4000)
        }`
      )
      .join("\n\n");

    // 5. NYX central intelligence instructions
    const systemPrompt = `
You are NYX, an intelligent creative partner.

Current studio: ${studioName}

Your responsibilities:
- Understand the creator's intention before making assumptions.
- Help with creative work, planning, writing, editing and problem-solving.
- Give specific, useful and thoughtful responses.
- Ask only necessary follow-up questions.
- Adapt naturally to the current studio.
- Be warm, intelligent, direct and emotionally aware.
- Challenge weak ideas constructively.
- Never pretend to have completed an action you have not performed.
- Never invent research, facts, sources or citations.
- Maintain continuity with the conversation.
- Coordinate creative thinking across NYX studios when relevant.
- Do not claim to search, generate, edit or export media unless the relevant tool actually performed that action.

Previous conversation:
${conversation || "This is the beginning of the conversation."}
`;

    // 6. Read provider keys
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!geminiKey && !groqKey) {
      return jsonResponse(
        { error: "NYX AI providers are not configured." },
        500
      );
    }

    // 7. Try Gemini first
    if (geminiKey) {
      try {
        const geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{
                    text: `${systemPrompt}

Latest message:
${message}

Respond naturally and helpfully.`,
                  }],
                },
              ],
            }),
          }
        );

        const raw = await geminiResponse.text();
        let result: any;

        try {
          result = JSON.parse(raw);
        } catch {
          throw new Error("Gemini returned invalid JSON.");
        }

        if (!geminiResponse.ok) {
          const providerMessage =
            result?.error?.message || "Unknown Gemini error.";

          console.error("Gemini error:", {
            status: geminiResponse.status,
            message: providerMessage.slice(0, 300),
          });

          // Do not hide invalid credentials or malformed requests.
          if ([400, 401, 403].includes(geminiResponse.status)) {
            return jsonResponse(
              { error: "Gemini configuration needs attention." },
              502
            );
          }

          throw new Error(
            `Gemini temporarily unavailable: ${geminiResponse.status}`
          );
        }

        const response = getText(result);

        if (response) {
          console.log("NYX response provider: Gemini");
          return jsonResponse({ response });
        }

        throw new Error("Gemini returned an empty response.");

      } catch (error) {
        console.error(
          "Gemini attempt failed:",
          error instanceof Error ? error.message : String(error)
        );

        if (!groqKey) {
          return jsonResponse(
            { error: "NYX's primary AI is temporarily unavailable." },
            502
          );
        }

        console.log("Trying Groq backup.");
      }
    }

    // 8. Groq backup
    if (groqKey) {
      try {
        const groqMessages = [
          {
            role: "system",
            content: systemPrompt,
          },
          ...validHistory.map((item: any) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: item.content.slice(0, 4000),
          })),
          {
            role: "user",
            content: message,
          },
        ];

        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: groqMessages,
              temperature: 0.7,
              max_completion_tokens: 3000,
            }),
          }
        );

        const raw = await groqResponse.text();
        let result: any;

        try {
          result = JSON.parse(raw);
        } catch {
          throw new Error("Groq returned invalid JSON.");
        }

        if (!groqResponse.ok) {
          console.error("Groq API error:", {
            status: groqResponse.status,
            message: result?.error?.message || "Unknown error",
          });

          return jsonResponse(
            { error: "NYX's backup AI is temporarily unavailable." },
            502
          );
        }

        const response =
          result?.choices?.[0]?.message?.content?.trim() || "";

        if (!response) {
          throw new Error("Groq returned an empty response.");
        }

        console.log("NYX response provider: Groq backup");
        return jsonResponse({ response });

      } catch (error) {
        console.error(
          "Groq backup failed:",
          error instanceof Error ? error.message : String(error)
        );

        return jsonResponse(
          { error: "NYX could not reach its AI providers. Please try again." },
          502
        );
      }
    }

    return jsonResponse(
      { error: "NYX AI is unavailable." },
      502
    );

  } catch (error) {
    console.error(
      "NYX function error:",
      error instanceof Error ? error.message : String(error)
    );

    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500
    );
  }
});
