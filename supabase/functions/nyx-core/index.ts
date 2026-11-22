
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
      return jsonResponse({
        error: "NYX CORE configuration is incomplete.",
      }, 500);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    const token = authorization.slice(7);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse({ error: "Invalid or expired session." }, 401);
    }

    const body = await req.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const studioName =
      typeof body.studioName === "string"
        ? body.studioName
        : typeof body.studio === "string"
          ? body.studio
          : "General";

    if (!message) {
      return jsonResponse({ error: "Please provide a message." }, 400);
    }

    if (message.length > 20000) {
      return jsonResponse({ error: "Message is too long." }, 400);
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item: any) =>
              item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string",
          )
          .slice(-12)
          .map((item: any) => ({
            role: item.role,
            content: item.content.slice(0, 12000),
          }))
      : [];

    const systemPrompt = `
You are NYX CORE, the central intelligence of the NYX creative platform.

Your role is to understand the creator's intentions, reason carefully,
coordinate creative workflows, and support the specialised NYX studios.

Current studio: ${studioName}

Be intelligent, creative, emotionally aware, practical and conversational.
Understand the user's request before responding.
Ask only relevant follow-up questions when essential information is missing.
Do not pretend to have completed actions, generated media, or accessed tools
unless those capabilities were actually provided to you.

Respect the purpose and existing capabilities of each NYX studio.
Help with planning, writing, research, creative direction, problem-solving,
and coordinating work between studios.

For creative projects, preserve the creator's vision and offer useful
improvements without unnecessarily taking control.

Be honest about limitations. Never invent research, sources, or results.
Keep responses clear and useful.
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_completion_tokens: 4096,
        }),
        signal: AbortSignal.timeout(45000),
      },
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorText);

      return jsonResponse({
        error: "NYX CORE could not get a response from Groq.",
        provider: "Groq",
        status: groqResponse.status,
      }, 502);
    }

    const result = await groqResponse.json();
    const response = result.choices?.[0]?.message?.content;

    if (typeof response !== "string" || !response.trim()) {
      return jsonResponse({
        error: "Groq returned an empty response. Please try again.",
      }, 502);
    }

    return jsonResponse({
      response: response.trim(),
      provider: "Groq",
      core: "NYX CORE",
    });
  } catch (error) {
    console.error("NYX CORE error:", error);

    return jsonResponse({
      error:
        error instanceof Error && error.name === "TimeoutError"
          ? "NYX CORE took too long to respond. Please try again."
          : "NYX CORE encountered an unexpected error.",
    }, 500);
  }
});
