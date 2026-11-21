
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
    // Verify that the caller is signed in.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return jsonResponse(
        { error: "Please sign in to use NYX AI." },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse(
        { error: "Supabase configuration is missing." },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401,
      );
    }

    // Read the user's message and studio context.
    const body = await req.json();
    const message = String(body.message || "").trim();
    const studio = String(body.studio || "Creative Studio").slice(0, 100);

    if (!message) {
      return jsonResponse({ error: "Please enter a message." }, 400);
    }

    if (message.length > 12000) {
      return jsonResponse(
        { error: "Your message is too long." },
        400,
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return jsonResponse(
        { error: "NYX AI is not configured yet." },
        500,
      );
    }

    // Keep recent conversation context.
    const history = Array.isArray(body.history)
      ? body.history.slice(-12)
      : [];

    const conversation = history
      .filter((item: any) =>
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
      )
      .map((item: any) =>
        `${item.role === "user" ? "User" : "NYX"}: ${
          item.content.slice(0, 4000)
        }`
      )
      .join("\n\n");

    const prompt = `
You are NYX, an intelligent creative partner.

Current studio: ${studio}

Your role:
- Understand what the creator wants before making assumptions.
- Help with creative work, planning, writing, editing and problem-solving.
- Give useful, specific answers instead of generic advice.
- Ask only necessary follow-up questions.
- Adapt your response to the current studio.
- Be warm, natural, thoughtful and direct.
- Never claim that you created, edited, researched or published something
  unless that action was actually completed.
- If asked for live research or current facts, be honest if live web
  search has not been performed. Never invent sources or citations.

Previous conversation:
${conversation || "This is the beginning of the conversation."}

Latest message from the creator:
${message}

Respond naturally and helpfully.
`;

    // Send the request to Gemini.
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

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Gemini error:", result);

      return jsonResponse(
        { error: "NYX could not generate a response. Please try again." },
        aiResponse.status === 429 ? 429 : 502,
      );
    }

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
      return jsonResponse(
        { error: "NYX received an empty response. Please try again." },
        502,
      );
    }

    return jsonResponse({ reply });
  } catch (error) {
    console.error("NYX function error:", error);

    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500,
    );
  }
});
