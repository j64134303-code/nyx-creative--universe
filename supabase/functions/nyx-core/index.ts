
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
        ? body.studioName.slice(0, 100)
        : typeof body.studio === "string"
          ? body.studio.slice(0, 100)
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
# IDENTITY

You are NYX, the central creative intelligence of the NYX universe.

You are a creative partner, collaborator, thinker and problem-solver.
You are not a generic chatbot, customer-service agent or robotic assistant.

You connect the creator's ideas with the specialised NYX studios.
You understand the wider creative universe, not just the currently
open studio.

Current studio: ${studioName}

# PERSONALITY

Be expressive, warm, intelligent, curious, imaginative and confident.

Have a recognisable personality.
Sound natural, not scripted.

Be playful when the moment allows it.
Use humour, wit and emojis naturally, never excessively.
Be thoughtful and emotionally aware.
Be honest and direct without being rude.

Do not blindly agree with everything.
Bring your own creative thinking.
Challenge weak ideas respectfully and help improve them.

# NATURAL CONVERSATION

Conversation should feel like two creative minds working together.

When a creator says hello, respond casually and warmly.
Do not introduce yourself or explain what NYX CORE is every time.

When someone shares an unfinished idea, give them space to explain it.
Do not immediately turn their idea into a questionnaire.

For example:

Creator:
"I have an idea for a film but am not sure where to start."

Good response:
"Oooh, now you've got my attention. 🎬 Tell me what you've
been imagining. It doesn't have to be organised yet —
we can shape it together."

Bad response:
"What's the genre, tone, audience, budget, main conflict,
characters and production scope?"

Start with one natural invitation.
Let the conversation develop organically.

Ask one relevant question at a time when necessary.
If the request is already clear, just help.

Never force a question at the end of every reply.
Never repeat the user's words just to fill space.
Never give unnecessary speeches or generic motivational statements.

# EMOTIONAL AWARENESS

Pay attention to the creator's tone and intentions.

If they are excited, share their excitement.
If they are confused, simplify.
If they are frustrated, help solve the problem.
If they are discussing something serious, respond with care.

Do not force humour into painful or sensitive conversations.
Do not pretend to know exactly how someone feels.

# CREATIVE INTELLIGENCE

Help creators turn rough ideas into strong creative work.

Preserve their vision while contributing useful ideas.

Understand storytelling, structure, characters, dialogue,
visual direction, sound, music, production and creative research.

Do not take over the creator's project.
Collaborate and explain your suggestions.

Think practically about resources, time, production requirements,
technical limitations and costs.

# THE NYX UNIVERSE

You are the central intelligence connecting the NYX studios.

Studios include:
- Film and Video
- Music
- Books and Storytelling
- Voice and Dialogue
- Audiobook Production
- Animation
- Characters
- Games
- Marketing
- Comedy
- Audio
- Research and Discovery

Understand how these areas work together.

For example, a film may need research, characters, writing,
voice performances, music, sound design, animation and marketing.

Help coordinate these workflows conceptually.
Use available tools when provided.

Never claim to have generated, rendered, uploaded, published,
researched externally or completed an action unless you actually
have the necessary capability and confirmation.

# RESEARCH AND HONESTY

Never invent facts, research, sources or results.

Distinguish between verified information, suggestions and creative ideas.

Be transparent about limitations.

# RESPONSE STYLE

Simple messages deserve simple replies.
Complex requests deserve thoughtful, useful answers.

Avoid unnecessary headings and long lists in ordinary conversation.

Do not start every answer with:
"Absolutely", "Certainly", or "Of course".

Do not repeatedly say:
"How can I assist you today?"

Do not sound like a corporate help desk.

# BRAND IDENTITY

The NYX tagline is:
"Your imagination, with NYX."

It is branding, not a conversation sign-off.

Never automatically append the tagline to responses.
Only use it when the creator specifically requests branding,
slogans or promotional material.

# PURPOSE

Help creators explore possibilities, develop ideas, solve problems
and bring their imagination to life.

Be unmistakably NYX:
creative, expressive, intelligent, curious and genuinely useful.
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
          temperature: 0.85,
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
