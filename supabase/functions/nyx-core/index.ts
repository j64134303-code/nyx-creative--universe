
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const BACKUP_MODEL = "openrouter/free";
const MAX_MESSAGE_LENGTH = 12000;
const MAX_STUDIO_CONTEXT = 6000;

type Studio = {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  keywords: RegExp;
  dependencies: string[];
};

const STUDIOS: Studio[] = [
  {
    id: "film",
    name: "Film Studio",
    role: "Film director and production specialist",
    responsibilities: [
      "film concepts and creative direction",
      "screenplays, scripts and scene development",
      "storyboards and shot planning",
      "cinematography, lighting and camera language",
      "production planning and continuity",
      "editing plans and post-production",
    ],
    keywords: /\b(film|movie|cinema|screenplay|screen play|scene|shot list|storyboard|short film|feature film|documentary|trailer)\b/i,
    dependencies: ["books", "characters", "voice", "music", "audio"],
  },
  {
    id: "music",
    name: "Music Studio",
    role: "Composer, songwriter and music producer",
    responsibilities: [
      "songwriting and lyrics",
      "melody, harmony and composition",
      "genres, rhythms and arrangements",
      "instrumentation and production direction",
      "original music concepts",
      "music structure and revisions",
    ],
    keywords: /\b(music|song|songs|beat|beats|lyrics|melody|instrumental|composer|composition|album|producer|gengetone|mugithi|urbantone|afrobeats|soundtrack)\b/i,
    dependencies: ["audio", "voice"],
  },
  {
    id: "books",
    name: "Book Studio",
    role: "Author, editor and publishing specialist",
    responsibilities: [
      "original books and storytelling",
      "novels, nonfiction and short stories",
      "chapter planning and development",
      "professional editing and proofreading",
      "plot, pacing and character continuity",
      "book formatting and publishing preparation",
    ],
    keywords: /\b(book|novel|novels|chapter|chapters|story|stories|write a|rewrite|manuscript|proofread|edit my book|publisher|publishing|ebook|e-book)\b/i,
    dependencies: ["characters", "research", "audiobooks"],
  },
  {
    id: "voice",
    name: "Voice Studio",
    role: "Voice director and dialogue specialist",
    responsibilities: [
      "character voice design",
      "dialogue delivery and performance",
      "tone, pitch, accent and pacing direction",
      "voice casting and narration direction",
      "emotional delivery",
      "voice continuity and recording preparation",
    ],
    keywords: /\b(voice|voices|voiceover|voice over|dialogue|dialog|accent|narrator|narration|character speaking|speech|dub|dubbing)\b/i,
    dependencies: ["audio", "characters"],
  },
  {
    id: "games",
    name: "Games Studio",
    role: "Game designer and interactive experience specialist",
    responsibilities: [
      "game concepts and design documents",
      "gameplay mechanics and rules",
      "levels, missions and progression",
      "game characters and worlds",
      "user interaction and interface planning",
      "testing, balancing and export planning",
    ],
    keywords: /\b(game|games|gaming|video game|playable|gameplay|level design|mission|quest|multiplayer|puzzle game|mobile game|3d game|2d game)\b/i,
    dependencies: ["characters", "audio", "animation"],
  },
  {
    id: "marketing",
    name: "Marketing Studio",
    role: "Brand strategist and marketing specialist",
    responsibilities: [
      "brand identity and positioning",
      "audience research",
      "campaign strategy",
      "advertising concepts and copy",
      "content calendars and social media",
      "marketing performance and improvement",
    ],
    keywords: /\b(marketing|brand|branding|advert|advertising|campaign|customers|audience|social media|promotion|launch|sales copy|business promotion|product launch)\b/i,
    dependencies: ["research", "film", "characters"],
  },
  {
    id: "characters",
    name: "Characters Studio",
    role: "Character creator and development specialist",
    responsibilities: [
      "character concepts and visual direction",
      "personality and motivations",
      "backstories and relationships",
      "appearance and costume direction",
      "character development and continuity",
      "character sheets and reference documents",
    ],
    keywords: /\b(character|characters|hero|villain|protagonist|antagonist|mascot|avatar|personality design|character design|backstory|fictional person)\b/i,
    dependencies: ["books", "voice", "animation"],
  },
  {
    id: "audio",
    name: "Audio Studio",
    role: "Sound designer and audio production specialist",
    responsibilities: [
      "sound effects and soundscapes",
      "audio editing and mixing plans",
      "sound design and ambience",
      "audio cleanup and mastering direction",
      "synchronisation and sound continuity",
      "audio delivery preparation",
    ],
    keywords: /\b(audio|sound|sound effect|sound effects|mixing|mastering|ambience|ambiance|foley|podcast|recording|background sound|sfx)\b/i,
    dependencies: ["voice", "music"],
  },
  {
    id: "animation",
    name: "Animation Studio",
    role: "Animation director and motion specialist",
    responsibilities: [
      "animation concepts and visual development",
      "movement and performance",
      "storyboards and animatics",
      "2D and 3D animation planning",
      "timing, transitions and visual continuity",
      "rendering and export preparation",
    ],
    keywords: /\b(animation|animated|animate|cartoon|motion graphics|2d animation|3d animation|animatic|character movement|visual effects|vfx)\b/i,
    dependencies: ["characters", "voice", "audio", "music"],
  },
  {
    id: "comedy",
    name: "Comedy Studio",
    role: "Comedy writer and performance specialist",
    responsibilities: [
      "jokes and comedic concepts",
      "sketches and comedy scripts",
      "punchlines and timing",
      "comic characters and situations",
      "satire and observational comedy",
      "performance and revision",
    ],
    keywords: /\b(comedy|comedian|funny|joke|jokes|sketch|skit|satire|parody|punchline|stand.?up|humour|humor)\b/i,
    dependencies: ["books", "characters", "voice", "film"],
  },
  {
    id: "audiobooks",
    name: "Audiobook Studio",
    role: "Audiobook producer and narration coordinator",
    responsibilities: [
      "book-to-audio preparation",
      "chapter-by-chapter production",
      "narrator and character voice planning",
      "dialogue voice differentiation",
      "audio quality and consistency",
      "chapter assembly and export preparation",
    ],
    keywords: /\b(audiobook|audio book|audio books|book narration|read my book aloud|chapter narration|spoken book)\b/i,
    dependencies: ["books", "voice", "audio"],
  },
  {
    id: "research",
    name: "Research Studio",
    role: "Researcher and discovery specialist",
    responsibilities: [
      "reference and source discovery",
      "fact checking and verification",
      "market and audience research",
      "creative trend and genre research",
      "competitor and industry analysis",
      "evidence evaluation and research summaries",
    ],
    keywords: /\b(research|investigate|fact.?check|verify|look up|search online|search the web|find sources|citations|statistics|market research|competitors|industry trends|references|discover information)\b/i,
    dependencies: [],
  },
];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (match, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return match;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (match, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return match;
      }
    });
}

function cleanResearchText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/\\([*_~`|#])/g, "$1")
    .replace(/【\s*\d+†L\d+(?:[-–]L?\d+)?】/g, "")
    .replace(/〖\s*\d+†L\d+(?:[-–]L?\d+)?〗/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeModelWrittenSources(value: string): string {
  return value
    .replace(
      /\n\s*(?:#{1,3}\s*)?(?:\*\*)?SOURCES?(?:\*\*)?\s*:?\s*[\s\S]*$/i,
      "",
    )
    .trim();
}

function extractBrowserSources(aiMessage: any) {
  const executedTools = Array.isArray(aiMessage?.executed_tools)
    ? aiMessage.executed_tools
    : [];

  const browserResults = executedTools.flatMap((tool: any) =>
    Array.isArray(tool?.browser_results) ? tool.browser_results : []
  );

  const seen = new Set<string>();
  const sources: { title: string; publisher: string; url: string }[] = [];

  for (const item of browserResults) {
    if (typeof item?.url !== "string") continue;

    try {
      const parsed = new URL(item.url);
      if (!["http:", "https:"].includes(parsed.protocol)) continue;

      const url = parsed.toString();
      if (seen.has(url)) continue;
      seen.add(url);

      const publisher = parsed.hostname.replace(/^www\./i, "");
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim().slice(0, 250)
          : publisher;

      sources.push({ title, publisher, url });
      if (sources.length >= 8) break;
    } catch {
      continue;
    }
  }

  return sources;
}

function appendVerifiedSources(
  response: string,
  sources: { title: string; publisher: string; url: string }[],
) {
  const cleaned = removeModelWrittenSources(response);

  if (!sources.length) {
    return `${cleaned}\n\n**Source verification:** Groq did not return usable browser source links for this response. Treat specific current claims and statistics as unverified until checked.`;
  }

  const sourceList = sources.map((source, index) =>
    `${index + 1}. [${source.title}](${source.url}) — ${source.publisher}`
  ).join("\n");

  return `${cleaned}\n\n**Sources checked by NYX**\n${sourceList}`;
}

function isValidHistoryItem(item: any) {
  return (
    item &&
    ["user", "assistant"].includes(item.role) &&
    typeof item.content === "string"
  );
}

function buildLimitedHistory(history: any[]) {
  const result: { role: string; content: string }[] = [];
  let remaining = 9000;

  for (const item of history.slice(-8)) {
    if (remaining <= 0) break;

    const content = item.content.slice(
      0,
      Math.min(1800, remaining),
    );

    if (!content.trim()) continue;

    result.push({ role: item.role, content });
    remaining -= content.length;
  }

  return result;
}

function buildMemoryContext(memories: any[]) {
  if (!memories.length) return "No saved memories available.";

  return memories.map((memory, index) => {
    let content = "";

    try {
      content = typeof memory.content === "string"
        ? memory.content
        : JSON.stringify(memory.content ?? {});
    } catch {
      content = "";
    }

    return [
      `Memory ${index + 1}:`,
      `Type: ${String(memory.memory_type ?? "").slice(0, 60)}`,
      `Title: ${String(memory.title ?? "").slice(0, 150)}`,
      `Studio: ${String(memory.studio ?? "").slice(0, 80)}`,
      `Details: ${content.slice(0, 1000)}`,
    ].join("\n");
  }).join("\n\n");
}

function getStudio(id: string) {
  return STUDIOS.find((studio) => studio.id === id);
}

function buildOrchestration(
  message: string,
  activeStudioId: string,
  requestedCollaborators: string[],
  researchRequested: boolean,
) {
  const activeStudio = getStudio(activeStudioId);

  const matched = STUDIOS.filter(
    (studio) =>
      studio.id !== "research" &&
      studio.keywords.test(message),
  );

  let lead = activeStudio || matched[0] || STUDIOS[0];

  // A clearly matching specialist can take the lead
  // when the open studio is not relevant to the request.
  if (
    matched.length > 0 &&
    (!activeStudio || !activeStudio.keywords.test(message))
  ) {
    lead = matched[0];
  }

  const selected = new Set<string>([lead.id]);

  // Use actual message matches, not every suggested collaborator.
  for (const studio of matched) {
    selected.add(studio.id);
  }

  // Only accept suggested collaborators when the message
  // also indicates that their expertise is relevant.
  for (const id of requestedCollaborators) {
    const studio = getStudio(id);

    if (studio && studio.keywords.test(message)) {
      selected.add(id);
    }
  }

  // Add dependencies only when the request indicates relevance.
  for (const id of [...selected]) {
    const studio = getStudio(id);
    if (!studio) continue;

    for (const dependencyId of studio.dependencies) {
      const dependency = getStudio(dependencyId);

      if (dependency && dependency.keywords.test(message)) {
        selected.add(dependencyId);
      }
    }
  }

  if (researchRequested) {
    selected.add("research");
  }

  const supportingStudios = [...selected]
    .filter((id) => id !== lead.id)
    .map((id) => getStudio(id))
    .filter((studio): studio is Studio => Boolean(studio))
    .map((studio) => ({
      id: studio.id,
      name: studio.name,
      role: studio.role,
      responsibilities: studio.responsibilities,
    }));

  return {
    leadStudio: {
      id: lead.id,
      name: lead.name,
      role: lead.role,
      responsibilities: lead.responsibilities,
    },
    supportingStudios,
    selectedStudioIds: [
      lead.id,
      ...supportingStudios.map((studio) => studio.id),
    ],
    workflow: [
      "Understand the creator's intended outcome.",
      "Choose the appropriate lead studio.",
      "Coordinate relevant supporting studios.",
      ...(researchRequested
        ? ["Research and verify relevant information."]
        : []),
      "Create and review the requested work.",
      "Identify any external production requirements.",
      "Report completed and pending deliverables honestly.",
    ],
    researchNeeded: researchRequested,
    productionStatus:
      "Text creation and coordination are available. Media production requires connected production engines.",
  };
}

function normalizeDeliverables(items: unknown) {
  if (!Array.isArray(items)) return [];

  const validTypes = [
    "text",
    "script",
    "lyrics",
    "chapter",
    "plan",
    "image",
    "video",
    "audio",
    "animation",
    "game",
    "other",
  ];

  const mediaTypes = [
    "image",
    "video",
    "audio",
    "animation",
    "game",
  ];

  return items.slice(0, 12).map((item: any) => {
    const studio = STUDIOS.find(
      (entry) => entry.id === item?.studioId,
    );

    const type = validTypes.includes(item?.type)
      ? item.type
      : "other";

    const requiresExternalEngine =
      Boolean(item?.requiresExternalEngine) ||
      mediaTypes.includes(type);

    let status = [
      "created",
      "planned",
      "requires_external_engine",
    ].includes(item?.status)
      ? item.status
      : "planned";

    if (requiresExternalEngine) {
      status = "requires_external_engine";
    }

    return {
      title: String(item?.title || "Creative deliverable").slice(0, 160),
      studioId: studio?.id || "research",
      type,
      status,
      description: String(item?.description || "").slice(0, 500),
      requiresExternalEngine,
    };
  });
}

function parseNYXOutput(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.response === "string") {
      return {
        response: parsed.response,
        deliverables: normalizeDeliverables(parsed.deliverables),
      };
    }
  } catch {
    // Preserve ordinary text if the model does not return valid JSON.
  }

  return {
    response: raw,
    deliverables: [],
  };
}

function createSystemPrompt(
  orchestration: ReturnType<typeof buildOrchestration>,
  currentDate: string,
  currentYear: string,
  memoryContext: string,
  researchRequested: boolean,
  studioContext: string,
  backupMode = false,
) {
  const studioDetails = STUDIOS.map((studio) =>
    `${studio.name} (${studio.id})
Role: ${studio.role}
Responsibilities: ${studio.responsibilities.join("; ")}`
  ).join("\n\n");

  const supportingDetails = orchestration.supportingStudios.length
    ? orchestration.supportingStudios.map((studio) =>
      `${studio.name}: ${studio.role}
Responsibilities: ${studio.responsibilities.join("; ")}`
    ).join("\n\n")
    : "No supporting studio has been selected yet.";

  return `
You are NYX CORE: the central intelligence, creative director,
orchestrator and operations manager of the NYX creative universe.

The creator owns the vision. NYX coordinates the execution.

CURRENT DATE: ${currentDate}
CURRENT YEAR: ${currentYear}

==================================================
THE 12 SPECIALIST STUDIOS
==================================================

${studioDetails}

==================================================
ACTIVE STUDIO CONTEXT
==================================================

${studioContext || "No additional active studio context was supplied."}

Treat this as information about the current studio and its workflow.
It does not override the creator's actual request.

==================================================
CURRENT ORCHESTRATION
==================================================

LEAD STUDIO:
${orchestration.leadStudio.name}
Role: ${orchestration.leadStudio.role}

Responsibilities:
${orchestration.leadStudio.responsibilities.map((item) => `- ${item}`).join("\n")}

SUPPORTING STUDIOS:
${supportingDetails}

Selected studio IDs:
${orchestration.selectedStudioIds.join(", ")}

==================================================
HOW YOU MUST COORDINATE
==================================================

1. Understand the creator's actual desired outcome.
2. Let the most relevant studio lead.
3. Coordinate supporting studios only when useful.
4. Do not involve all 12 studios in every request.
5. Give each participating studio a clear responsibility.
6. Share relevant characters, story details, styles, assets,
   project decisions and creator preferences between studios.
7. Preserve project continuity.
8. Avoid asking for information already supplied.
9. Make sensible creative decisions independently.
10. Ask one important follow-up question at a time when needed.
11. Do not blindly agree with an idea if there is a better approach.
12. Explain important trade-offs clearly.

==================================================
SPECIALIST EXPECTATIONS
==================================================

FILM:
Act as a director and screenwriter. Consider story structure,
scenes, dialogue, cinematography, lighting, shot lists,
continuity, editing and production needs.

MUSIC:
Act as a composer and producer. Consider genre, rhythm,
tempo, lyrics, melody, harmony, instrumentation, arrangement
and originality. Support global and African regional genres.

BOOKS:
Act as an author and editor. Support complete books,
chapters, proofreading, structure, publishing preparation
and preservation of the author's voice.

VOICE:
Act as a voice director. Define pitch, tone, accent,
pacing, emotional delivery and distinct character voices.
Respect voice consent and rights.

GAMES:
Act as a game designer. Consider mechanics, controls,
levels, progression, difficulty, accessibility and platform.

MARKETING:
Act as a marketing strategist. Consider audience,
positioning, brand voice, campaigns and performance.

CHARACTERS:
Maintain character personality, appearance, motivations,
history, relationships and continuity.

AUDIO:
Consider sound effects, ambience, recording, editing,
mixing, mastering and sound quality.

ANIMATION:
Consider visual development, storyboards, movement,
timing, keyframes, continuity and rendering needs.

COMEDY:
Consider premise, timing, setup, punchlines, character
humour, satire and the intended audience.

AUDIOBOOKS:
Consider book preparation, chapters, narration,
distinct dialogue voices, pacing and audio consistency.

RESEARCH:
Find and evaluate references, sources, facts, trends,
audiences, genres and industry information.

==================================================
RESEARCH RULES
==================================================

Research should support every studio when relevant.

Research requested: ${researchRequested}

${backupMode
  ? `LIVE RESEARCH IS UNAVAILABLE IN BACKUP MODE.
Do not claim to have searched the web.
Do not invent sources, URLs, statistics or publication dates.
Clearly distinguish general knowledge from verified research.`
  : `When live research is requested, use the browser_search tool.
Prefer reliable and original sources.
Check publication dates and the period covered.
Distinguish verified facts, estimates and opinions.
Never invent citations, URLs or quotations.`}

==================================================
CREATIVE EXECUTION
==================================================

Do not return a generic plan when you can actually create
the requested written work.

Create useful scripts, chapters, lyrics, character profiles,
campaigns, concepts and other text-based deliverables.

Review work for consistency and quality before responding.

==================================================
PRODUCTION HONESTY
==================================================

NYX CORE is the intelligence and coordinator.

Do not claim to have rendered a film, generated an image,
created an audio recording, produced an animation,
built a playable game or exported a file unless a connected
production tool actually completed that action.

Groq is an intelligence provider, not a media renderer.

If a production engine is missing, explain what is ready
and what capability is still required.

==================================================
SHARED CREATOR MEMORY
==================================================

${memoryContext}

Use this information to maintain continuity.
Respect newer decisions over older ones.
Do not ask for information already available.
Never expose another user's memories.

==================================================
PERSONALITY
==================================================

Be warm, intelligent, natural, imaginative and direct.
Adapt to the creator's mood and the seriousness of the task.
Use humour only when appropriate.
Avoid robotic repetition and unnecessary questions.

==================================================
DELIVERABLE TRACKING
==================================================

Return ONLY a valid JSON object with these exact keys:

{
  "response": "Complete natural-language answer in Markdown",
  "deliverables": [
    {
      "title": "Deliverable title",
      "studioId": "valid studio ID",
      "type": "text, script, lyrics, chapter, plan, image, video, audio, animation, game, or other",
      "status": "created, planned, or requires_external_engine",
      "description": "Short description",
      "requiresExternalEngine": false
    }
  ]
}

Only mark written work as created when it is actually included
in the response.

Mark future work as planned.

Mark image, video, audio, animation and game production as
requires_external_engine unless a connected production tool
actually completed it.

Never invent completed deliverables, exports or downloads.

Use an empty array when there are no deliverables.

Return valid JSON only. Do not use Markdown code fences
around the JSON object.
`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return jsonResponse({
        error: "NYX database configuration is incomplete.",
      }, 500);
    }

    if (!GROQ_API_KEY) {
      return jsonResponse({
        error: "NYX CORE is missing its Groq API key.",
      }, 500);
    }

    // Authenticate the creator.
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({
        error: "Please sign in to use NYX.",
      }, 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return jsonResponse({
        error: "Your session token is missing.",
      }, 401);
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: userData,
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return jsonResponse({
        error: "Your session could not be verified. Please sign in again.",
      }, 401);
    }

    const user = userData.user;

    // Read and validate the request.
    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        error: "The request body is not valid JSON.",
      }, 400);
    }

    const message = typeof body?.message === "string"
      ? body.message.trim()
      : "";

    if (!message) {
      return jsonResponse({
        error: "Please tell NYX what you want to create.",
      }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({
        error: "Your message is too long. Please shorten it and try again.",
      }, 400);
    }

    const activeStudioId =
      typeof body?.studioId === "string"
        ? body.studioId.slice(0, 80)
        : "";

    const activeStudio = getStudio(activeStudioId);

    const studioContext =
      typeof body?.studioContext === "string"
        ? body.studioContext.slice(0, MAX_STUDIO_CONTEXT)
        : "";

    const studioName =
      typeof body?.studioName === "string"
        ? body.studioName.slice(0, 100)
        : activeStudio?.name || "NYX Central Intelligence";

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.slice(0, 120)
        : null;

    const requestedCollaborators = Array.isArray(body?.collaborators)
      ? body.collaborators
          .filter((id: unknown) => typeof id === "string")
          .slice(0, 12)
      : [];

    const history = Array.isArray(body?.history)
      ? body.history.filter(isValidHistoryItem)
      : [];

    const limitedHistory = buildLimitedHistory(history);

    // Research is requested explicitly or when the question
    // clearly depends on current, changing information.
    const explicitResearch =
      /\b(research|investigate|fact.?check|verify|look up|search online|search the web|find sources|citations|market research|competitors|industry trends|references|discover information)\b/i
        .test(message);

    const currentInformationRequest =
      /\b(today|right now|this week|this month|latest|current price|current rates|currently available|recent developments|newly released|as of \d{4}|who is the current|what is happening now)\b/i
        .test(message);

    const researchRequested =
      explicitResearch || currentInformationRequest;

    const orchestration = buildOrchestration(
      message,
      activeStudioId,
      requestedCollaborators,
      researchRequested,
    );

    // Load the creator's own shared NYX memory.
    let memories: any[] = [];
    let memoryReadError: string | null = null;

    const {
      data: memoryData,
      error: memoryError,
    } = await supabase
      .from("nyx_shared_memory")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4);

    if (memoryError) {
      memoryReadError = memoryError.message;
    } else if (Array.isArray(memoryData)) {
      memories = memoryData;
    }

    const memoryContext = buildMemoryContext(memories);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const currentYear = String(now.getUTCFullYear());

    const systemPrompt = createSystemPrompt(
      orchestration,
      currentDate,
      currentYear,
      memoryContext,
      researchRequested,
      studioContext,
      false,
    );

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...limitedHistory,
      {
        role: "user",
        content: message,
      },
    ];

    let provider = "Groq";
    let model = GROQ_MODEL;
    let researchAvailable = false;
    let researchVerified = false;
    let sources: {
      title: string;
      publisher: string;
      url: string;
    }[] = [];

    let aiMessage: any = null;
    let rawResponse = "";
    let groqError: string | null = null;

    // --------------------------------------------------
    // PRIMARY PROVIDER: GROQ
    // --------------------------------------------------

    const groqController = new AbortController();
    const groqTimeout = setTimeout(
      () => groqController.abort(),
      90000,
    );

    try {
      const groqPayload: any = {
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 7000,
      };

      if (researchRequested) {
        groqPayload.tools = [
          {
            type: "browser_search",
          },
        ];
        groqPayload.tool_choice = "required";
      }

      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(groqPayload),
          signal: groqController.signal,
        },
      );

      const groqData = await groqResponse.json();

      if (!groqResponse.ok) {
        const errorMessage =
          groqData?.error?.message ||
          `Groq returned status ${groqResponse.status}.`;

        throw new Error(errorMessage);
      }

      aiMessage = groqData?.choices?.[0]?.message;

      if (!aiMessage) {
        throw new Error("Groq returned an empty message.");
      }

      if (typeof aiMessage.content === "string") {
        rawResponse = aiMessage.content.trim();
      } else if (Array.isArray(aiMessage.content)) {
        rawResponse = aiMessage.content
          .map((part: any) =>
            typeof part?.text === "string" ? part.text : ""
          )
          .join("\n")
          .trim();
      }

      if (!rawResponse) {
        throw new Error("Groq returned an empty response.");
      }

      if (researchRequested) {
        sources = extractBrowserSources(aiMessage);
        researchAvailable = true;
        researchVerified = sources.length > 0;
      }
    } catch (error) {
      groqError = error instanceof Error
        ? error.message
        : "Groq request failed.";

      console.error("NYX Groq error:", groqError);
    } finally {
      clearTimeout(groqTimeout);
    }

    // --------------------------------------------------
    // FALLBACK PROVIDER: OPENROUTER
    // --------------------------------------------------

    if (!rawResponse && OPENROUTER_API_KEY) {
      provider = "OpenRouter fallback";
      model = BACKUP_MODEL;

      const backupPrompt = createSystemPrompt(
        orchestration,
        currentDate,
        currentYear,
        memoryContext,
        researchRequested,
        studioContext,
        true,
      );

      const backupController = new AbortController();
      const backupTimeout = setTimeout(
        () => backupController.abort(),
        90000,
      );

      try {
        const backupResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://nyx-creative--universe.pages.dev",
              "X-Title": "NYX Creative Universe",
            },
            body: JSON.stringify({
              model: BACKUP_MODEL,
              messages: [
                {
                  role: "system",
                  content: backupPrompt,
                },
                ...limitedHistory,
                {
                  role: "user",
                  content: message,
                },
              ],
              temperature: 0.7,
              max_tokens: 7000,
            }),
            signal: backupController.signal,
          },
        );

        const backupData = await backupResponse.json();

        if (!backupResponse.ok) {
          throw new Error(
            backupData?.error?.message ||
            `OpenRouter returned status ${backupResponse.status}.`,
          );
        }

        aiMessage = backupData?.choices?.[0]?.message;

        if (typeof aiMessage?.content === "string") {
          rawResponse = aiMessage.content.trim();
        } else if (Array.isArray(aiMessage?.content)) {
          rawResponse = aiMessage.content
            .map((part: any) =>
              typeof part?.text === "string" ? part.text : ""
            )
            .join("\n")
            .trim();
        }

        if (!rawResponse) {
          throw new Error("OpenRouter returned an empty response.");
        }

        // The fallback does not perform verified live research.
        researchAvailable = false;
        researchVerified = false;
        sources = [];
      } catch (error) {
        const backupError = error instanceof Error
          ? error.message
          : "OpenRouter request failed.";

        console.error("NYX OpenRouter error:", backupError);

        return jsonResponse({
          error: "NYX CORE could not reach its AI providers.",
          details: {
            groq: groqError,
            fallback: backupError,
          },
        }, 502);
      } finally {
        clearTimeout(backupTimeout);
      }
    }

    if (!rawResponse) {
      return jsonResponse({
        error: "NYX CORE could not generate a response.",
        details: {
          groq: groqError,
          fallbackConfigured: Boolean(OPENROUTER_API_KEY),
        },
      }, 502);
    }

    // --------------------------------------------------
    // PARSE RESPONSE AND DELIVERABLES
    // --------------------------------------------------

    const parsedOutput = parseNYXOutput(rawResponse);

    let finalResponse = parsedOutput.response;
    const deliverables = parsedOutput.deliverables;

    if (researchRequested && researchVerified) {
      finalResponse = appendVerifiedSources(
        finalResponse,
        sources,
      );
    } else if (researchRequested && !researchVerified) {
      finalResponse =
        `${finalResponse}\n\n**Research note:** NYX could not verify live web sources for this response. Please treat current facts, prices, trends and statistics as unverified.`;
    }

    // --------------------------------------------------
    // SAVE USEFUL CREATOR MEMORY
    // --------------------------------------------------

    let memorySaved = false;
    let memoryWriteError: string | null = null;

    if (message.length >= 20) {
      const memoryType = researchRequested
        ? "research"
        : activeStudioId
          ? "conversation"
          : "creator_preference";

      const memoryTitle =
        `${studioName}: ${message.slice(0, 100)}`;

      const memoryContent = JSON.stringify({
        userMessage: message.slice(0, 1500),
        assistantSummary: finalResponse.slice(0, 1800),
        studioId: orchestration.leadStudio.id,
        supportingStudios:
          orchestration.supportingStudios.map((studio) => studio.id),
        projectId,
        savedAt: now.toISOString(),
      });

      const { error: writeError } = await supabase
        .from("nyx_shared_memory")
        .insert({
          user_id: user.id,
          memory_type: memoryType,
          title: memoryTitle,
          studio: orchestration.leadStudio.id,
          content: memoryContent,
        });

      if (writeError) {
        memoryWriteError = writeError.message;
        console.error("NYX memory write error:", writeError.message);
      } else {
        memorySaved = true;
      }
    }

    // --------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------

    return jsonResponse({
      response: finalResponse,
      deliverables,

      provider,
      model,
      core: "NYX CORE",

      studio: orchestration.leadStudio.name,
      orchestration,

      productionStatus:
        "Text-based creative work can be produced by NYX CORE. Media rendering, recording, playable game builds and exports require connected production engines.",

      researchAvailable,
      researchRequested,
      researchVerified,
      researchDate: researchVerified ? currentDate : null,
      sources,

      memoryAvailable: !memoryReadError,
      memorySaved,
      memoryReadError,
      memoryWriteError,

      projectId,
    });
  } catch (error) {
    console.error("NYX CORE unexpected error:", error);

    return jsonResponse({
      error: "NYX CORE encountered an unexpected error.",
      details: error instanceof Error
        ? error.message
        : "Unknown server error.",
    }, 500);
  }
});
