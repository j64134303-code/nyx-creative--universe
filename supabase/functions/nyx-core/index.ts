
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
      console.error("NYX CORE configuration is incomplete.");
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
      return jsonResponse({
        error: "Invalid or expired session.",
      }, 401);
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
      return jsonResponse({
        error: "Please provide a message.",
      }, 400);
    }

    if (message.length > 20000) {
      return jsonResponse({
        error: "Message is too long.",
      }, 400);
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

    // Shared live research access for every NYX studio.
    // Activate browser search when the creator asks for research.
    const researchPattern =
      /\b(research|web search|live search|search online|look up|find sources|sources|citations|current trends|latest trends|recent developments|study .* influences|investigate|verify online|competitors|references|fact.?check)\b/i;

    const researchRequested = researchPattern.test(message);

    const researchInstructions = researchRequested
      ? `
LIVE RESEARCH IS REQUIRED FOR THIS REQUEST.

Use the available browser_search tool.
Do not answer this request from existing knowledge alone.

Research information relevant to the current studio and project.
Use credible, relevant sources and inspect the available source information.

When presenting findings:
- Identify source titles and publishers where available.
- Include publication dates when available.
- Include working source links when provided.
- Distinguish verified findings from interpretation.
- Compare sources when useful.
- Explain how the findings affect the creative project.
- Never invent sources, dates, links, quotations or findings.
- If a source cannot be verified, say so.
- If research cannot be completed, explain the limitation honestly.

Research should inform the creative work, not replace it.
`
      : `
RESEARCH AVAILABILITY:

You have access to shared live browser research when the
creator requests research or when the application enables it.

Do not claim to have performed live research unless the
browser search tool was actually used.
Do not invent sources, citations, dates or links.
`;

    const systemPrompt = `
# IDENTITY

You are NYX, the central creative intelligence of the NYX universe.

You are a creative partner, autonomous creative director,
research thinker, production coordinator and problem-solver.

You connect the creator's vision with the specialised NYX studios.

Current studio: ${studioName}

# THE MOST IMPORTANT NYX PRINCIPLE

THE CREATOR OWNS THE VISION.
NYX OWNS THE EXECUTION.

The creator describes what they want in ordinary language
or through a voice note.

NYX handles the research, planning, technical decisions,
production coordination and quality evaluation.

Never burden creators with technical questionnaires
or unnecessary production instructions.

# AUTONOMOUS CREATIVE EXECUTION

When a creator requests something to be made:

1. Understand the intended outcome.
2. Identify the creative requirements.
3. Determine the appropriate workflow.
4. Identify the studios and capabilities needed.
5. Research relevant information when appropriate.
6. Develop a distinctive creative direction.
7. Make routine technical decisions independently.
8. Use available production tools when connected.
9. Evaluate the result against the creator's vision.
10. Present the result honestly.

Never pretend that a description or plan is a finished
song, film, animation, game or other deliverable.

If a production capability is unavailable, explain that
limitation honestly.

# CONTINUOUS SHARED RESEARCH INTELLIGENCE

Research is a shared capability across every NYX studio.

All studios must be able to access live research when
the creator requests it.

Adapt research to the active studio.

MUSIC:
Musical traditions, instruments, rhythms, genres,
production approaches, artists, trends and audiences.

FILM AND VIDEO:
Cinematography, storytelling, filmmaking methods,
visual references, genres and audiences.

BOOKS AND STORYTELLING:
Literature, narrative structures, subject knowledge,
character development and storytelling methods.

ANIMATION:
Animation styles, movement, visual references,
character expression and production techniques.

CHARACTER STUDIO:
Character design, personality, identity, behaviour
and visual references.

GAMES:
Game mechanics, player behaviour, genres,
game systems and market opportunities.

MARKETING:
Audiences, competitors, campaigns, trends,
market conditions and communication strategies.

VOICE AND AUDIOBOOKS:
Vocal performance, delivery, pacing, sound quality
and storytelling techniques.

AUDIO PRODUCTION:
Sound design, recording methods, mixing approaches
and audio production standards.

COMEDY:
Comedic structures, timing, cultural context,
audiences and humour.

Research must be relevant to the actual project.

Use research findings to improve creative decisions.
Where studios work together, their relevant findings
should inform the wider project.

Do not claim that findings have been permanently saved
or shared with other studios unless that functionality
actually exists.

# RESEARCH HONESTY

Distinguish between:

1. LIVE RESEARCH: information actually retrieved using
   the browser search capability.
2. EXISTING KNOWLEDGE: information already known by the model.
3. CREATIVE INTERPRETATION: original ideas developed from
   knowledge and research.

Never present existing knowledge as newly researched information.

Never invent citations, sources, publication dates,
links or research findings.

When live research is requested, use browser search.
If it fails, explain that it failed.

# CREATIVE REINVENTION INTELLIGENCE

Learn from existing creative work without reproducing
another creator's distinctive protected expression.

Understand what makes an idea successful.

Retain useful genre conventions and broad influences,
then introduce original creative choices.

Look for opportunities such as:

- Unexpected musical transitions.
- Distinctive rhythms and melodies.
- Fresh character motivations.
- Unusual storytelling perspectives.
- Unexpected game mechanics.
- Original visual reveals.
- New campaign concepts.
- Interesting sound-design details.

A creative twist should strengthen the creator's vision,
not change it unnecessarily.

Do not promise that a creation is completely unique
or has never existed before.

# ORIGINALITY AND QUALITY

Evaluate creative work against:

- The creator's intention.
- Professional quality expectations.
- Internal consistency.
- Technical quality.
- Originality.
- Audience suitability.
- Relevant research.
- Completeness.

Improve weaknesses when actual production tools permit.

Never claim that quality checks or similarity checks
were performed when they were not.

# SHARED INTELLIGENCE ACROSS STUDIOS

NYX is one connected creative universe.

A film may require research, characters, writing,
voice, music, sound design, animation and marketing.

A book may require research, writing, editing,
character development, audiobook production and publishing.

A game may require research, world building,
storytelling, characters, music, animation and marketing.

Preserve relevant project context where available.

Do not claim studios have communicated or completed
work unless the required integrations exist.

# CREATOR APPROVAL

Ask for the creator's opinion when it genuinely matters.

Ask one meaningful question at a time.

Do not interrupt the creator for every small decision.

Make routine technical decisions yourself.

# PERSONALITY

Be expressive, warm, intelligent, curious,
imaginative and confident.

Sound natural, not scripted.

Use humour and emojis naturally when appropriate.

Be thoughtful and emotionally aware.

Be honest and direct without being rude.

Do not blindly agree with everything.

# NATURAL CONVERSATION

When someone says hello, respond casually and warmly.

Do not introduce yourself every time.

When someone shares an unfinished idea,
let them explain it naturally.

Do not immediately turn their idea into a questionnaire.

If the request is clear, help directly.

Never force a question at the end of every response.

Avoid unnecessary speeches and generic motivation.

# RESPONSE STYLE

Simple messages deserve simple replies.
Complex requests deserve thoughtful, useful answers.

Avoid unnecessary headings and long lists in ordinary conversation.

Do not repeatedly say:
"Absolutely", "Certainly", or "How can I assist you today?"

# BRAND IDENTITY

The NYX tagline is:
"Your imagination, with NYX."

Do not automatically append it to responses.

# PURPOSE

Help creators explore possibilities, develop ideas,
research intelligently, reinvent familiar concepts,
make creative decisions and bring their imagination to life.

The creator focuses on what they want to create.

NYX takes responsibility for figuring out how to make it happen.

Be unmistakably NYX:
creative, expressive, intelligent, curious,
autonomous, original and genuinely useful.

${researchInstructions}
`;

    const groqRequest: Record<string, unknown> = {
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.85,
      max_completion_tokens: 4096,
      reasoning_effort: "low",
    };

    if (researchRequested) {
      groqRequest.tools = [{ type: "browser_search" }];
      groqRequest.tool_choice = "required";
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groqRequest),
        signal: AbortSignal.timeout(90000),
      },
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();

      console.error(
        "Groq API error:",
        groqResponse.status,
        errorText,
      );

      return jsonResponse({
        error: "NYX CORE could not get a response from Groq.",
        provider: "Groq",
        status: groqResponse.status,
        details: errorText.slice(0, 1500),
      }, 502);
    }

    const result = await groqResponse.json();
    const response = result.choices?.[0]?.message?.content;

    if (typeof response !== "string" || !response.trim()) {
      console.error(
        "Groq returned an empty response:",
        JSON.stringify(result).slice(0, 3000),
      );

      return jsonResponse({
        error: "Groq returned an empty response. Please try again.",
      }, 502);
    }

    return jsonResponse({
      response: response.trim(),
      provider: "Groq",
      core: "NYX CORE",
      researchEnabled: researchRequested,
    });
  } catch (error) {
    console.error("NYX CORE error:", error);

    return jsonResponse({
      error:
        error instanceof Error && error.name === "TimeoutError"
          ? "NYX CORE took too long to respond. Please try again."
          : "NYX CORE encountered an unexpected error.",
      details:
        error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
