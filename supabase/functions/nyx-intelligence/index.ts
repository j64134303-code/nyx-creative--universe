
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // 1. Check authentication
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return jsonResponse(
        { error: "Please sign in to use NYX AI." },
        401,
      );
    }

    // 2. Read Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !publishableKey) {
      console.error("Missing Supabase URL or Publishable Key.");

      return jsonResponse(
        { error: "NYX authentication configuration is missing." },
        500,
      );
    }

    // 3. Verify the user's session
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } =
      await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("Authentication failed:", error?.message);

      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401,
      );
    }

    // 4. Read creator message
    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const message = String(body.message || "").trim();
    const studio = String(
      body.studio || "Creative Studio",
    ).slice(0, 100);

    if (!message) {
      return jsonResponse({ error: "Please enter a message." }, 400);
    }

    if (message.length > 12000) {
      return jsonResponse({ error: "Message is too long." }, 400);
    }

    // 5. Check Gemini configuration
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return jsonResponse(
        { error: "NYX AI is not configured yet." },
        500,
      );
    }

    // 6. Preserve recent conversation history
    const history = Array.isArray(body.history)
      ? body.history.slice(-12)
      : [];

    const conversation = history
      .filter((item: any) =>
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
      )
      .map((item: any) =>
        `${item.role === "user" ? "Creator" : "NYX"}: ${
          item.content.slice(0, 4000)
        }`
      )
      .join("\n\n");

    // 7. Build NYX intelligence prompt
    const prompt = `
You are NYX, an intelligent creative partner.

Current studio: ${studio}

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

Previous conversation:
${conversation || "This is the beginning of the conversation."}

Latest message:
${message}

Respond naturally and helpfully.
`;

    // 8. Connect to Gemini
    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: prompt,
        }),
      },
    );

    const rawResponse = await aiResponse.text();

    let result: any;

    try {
      result = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Gemini returned invalid JSON:",
        rawResponse.slice(0, 1500),
      );

      return jsonResponse(
        { error: "NYX received an invalid AI response." },
        502,
      );
    }

    // 9. Handle Gemini errors
    if (!aiResponse.ok) {
      console.error("Gemini API error:", {
        status: aiResponse.status,
        response: rawResponse.slice(0, 1500),
      });

      return jsonResponse(
        {
          error: "NYX could not generate a response. Please try again.",
        },
        aiResponse.status === 429 ? 429 : 502,
      );
    }

    // 10. Extract AI response
    const reply =
      result.steps
        ?.filter((step: any) => step.type === "model_output")
        .flatMap((step: any) => step.content || [])
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("\n")
        .trim() ||
      result.output_text ||
      "";

    if (!reply) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(result).slice(0, 1500),
      );

      return jsonResponse(
        { error: "NYX received an empty response. Please try again." },
        502,
      );
    }

    // 11. Return NYX response
    return jsonResponse({ reply });

  } catch (error) {
    console.error(
      "NYX function error:",
      error instanceof Error ? error.message : String(error),
    );

    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500,
    );
  }
});
