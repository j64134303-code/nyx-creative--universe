
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
    // 1. Verify the signed-in user
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return jsonResponse(
        { error: "Please sign in to use NYX AI." },
        401
      );
    }

    // 2. Read Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !publishableKey) {
      console.error("Missing Supabase configuration.");

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
      console.error(
        "Authentication failed:",
        error?.message
      );

      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401
      );
    }

    // 3. Read the request from App.jsx
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

    // Accept both names for compatibility
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

    // 4. Check Gemini secret
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return jsonResponse(
        { error: "NYX AI is not configured yet." },
        500
      );
    }

    // 5. Preserve recent conversation history
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

    // 6. Build NYX intelligence prompt
    const prompt = `
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

Previous conversation:
${conversation || "This is the beginning of the conversation."}

Latest message:
${message}

Respond naturally and helpfully.
`;

    // 7. Connect to Gemini 3.8 Flash
    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const rawResponse = await aiResponse.text();

    let result: any;

    try {
      result = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Gemini returned invalid JSON:",
        rawResponse.slice(0, 500)
      );

      return jsonResponse(
        { error: "NYX received an invalid AI response." },
        502
      );
    }

    // 8. Handle Gemini errors
    if (!aiResponse.ok) {
      const providerMessage =
        result?.error?.message || "Unknown Gemini error.";

      console.error("Gemini API error:", {
        status: aiResponse.status,
        message: providerMessage.slice(0, 500),
      });

      return jsonResponse(
        {
          error: `Gemini request failed (${aiResponse.status}): ${providerMessage.slice(0, 300)}`,
        },
        502
      );
    }

    // 9. Extract the generated response
    const response =
      result.candidates?.[0]?.content?.parts
        ?.filter((part: any) =>
          typeof part.text === "string" && !part.thought
        )
        .map((part: any) => part.text)
        .join("\n")
        .trim() || "";

    if (!response) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(result).slice(0, 500)
      );

      return jsonResponse(
        { error: "NYX received an empty response." },
        502
      );
    }

    // 10. Return exactly what App.jsx expects
    return jsonResponse({ response });

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
