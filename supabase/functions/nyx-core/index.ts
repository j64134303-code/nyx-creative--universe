
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================================
   NYX CORE — FOUNDATION
   Provider: Groq primary, OpenRouter fallback
   Runtime: Supabase Edge Functions / Deno
========================================================= */

/* -------------------------
   1. ENVIRONMENT
------------------------- */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";

const GROQ_MODEL =
  Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";

const OPENROUTER_MODEL =
  Deno.env.get("OPENROUTER_MODEL") ?? "openrouter/free";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_MESSAGE_LENGTH = 20_000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_MESSAGE_LENGTH = 12_000;
const MAX_PROJECT_ID_LENGTH = 128;
const MAX_SELECTED_STUDIOS = 12;
const MAX_DELIVERABLES = 20;
const MAX_SOURCES = 15;

const MEMORY_SETTINGS_TABLE = "nyx_memory_settings";
const SHARED_MEMORY_TABLE = "nyx_shared_memory";

/* -------------------------
   2. CORS
------------------------- */

const ALLOWED_ORIGINS = new Set([
  "https://nyx-creative-universe.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

/* -------------------------
   3. CORE TYPES
------------------------- */

type Studio = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type StudioSelectionMode =
  | "automatic"
  | "manual"
  | "combined";

type Orchestration = {
  mode: StudioSelectionMode;
  leadStudio: string;
  selectedStudios: string[];
  supportingStudios: string[];
  responsibilities: Record<string, string[]>;
  reasons: Record<string, string>;
  executionStatus: "planned";
};

type Deliverable = {
  id: string;
  title: string;
  type: string;
  description: string;
  content?: string;
  status: "draft" | "ready" | "needs_review";
};

type ResearchSource = {
  title: string;
  url: string;
  description: string;
  verified: boolean;
};

type MemoryUpdate = {
  action: "save" | "update" | "delete";
  category: string;
  content: string;
  reason?: string;
};

type MemorySettings = {
  enabled: boolean;
  allowPersonalMemory: boolean;
  allowProjectMemory: boolean;
};

type MemoryRecord = {
  id: string;
  user_id: string;
  project_id?: string | null;
  category?: string | null;
  content?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AuthenticatedUser = {
  id: string;
  email?: string;
};

type AIProvider = "groq" | "openrouter";

type AIResult = {
  response: string;
  provider: AIProvider;
  model: string;
};

type ParsedNYXOutput = {
  response: string;
  deliverables: Deliverable[];
  memoryUpdates: MemoryUpdate[];
  needsClarification: boolean;
  clarificationQuestion?: string;
};

type NYXRequest = {
  message: string;
  studioId?: string;
  studioName?: string;
  studioContext?: string;
  projectId?: string;
  history?: unknown;
  studioSelectionMode?: unknown;
  selectedStudios?: unknown;
};

type NYXResponse = {
  response: string;
  provider: AIProvider;
  model: string;
  studio: Studio;
  orchestration: Orchestration;
  deliverables: Deliverable[];
  sources: ResearchSource[];
  research: {
    requested: boolean;
    available: boolean;
    verified: boolean;
  };
  memory: {
    enabled: boolean;
    updates: number;
  };
  productionStatus: "planned" | "not_connected";
};

/* -------------------------
   4. ALL 12 NYX STUDIOS
------------------------- */

const STUDIOS: Studio[] = [
  {
    id: "film",
    name: "Film & Video",
    icon: "🎬",
    color: "#8B5CF6",
    description:
      "Film creation, screenwriting, scenes, cinematography, directing and video production."
  },
  {
    id: "music",
    name: "Music",
    icon: "🎵",
    color: "#EC4899",
    description:
      "Original music, songwriting, composition, beats, soundtracks and musical direction."
  },
  {
    id: "books",
    name: "Books & Writing",
    icon: "📚",
    color: "#F59E0B",
    description:
      "Book writing, editing, novels, chapters, manuscripts and publishing preparation."
  },
  {
    id: "voice",
    name: "Storytelling & Voice",
    icon: "🎙️",
    color: "#06B6D4",
    description:
      "Narration, character dialogue, voice direction, accents and expressive voice production."
  },
  {
    id: "games",
    name: "Game Creation",
    icon: "🎮",
    color: "#10B981",
    description:
      "Game concepts, worlds, mechanics, characters, levels and gameplay design."
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📈",
    color: "#F97316",
    description:
      "Brand strategy, campaigns, promotion, audience development and product launches."
  },
  {
    id: "characters",
    name: "Character Studio",
    icon: "🧑‍🎨",
    color: "#A78BFA",
    description:
      "Character creation, personalities, appearance, backstories and character development."
  },
  {
    id: "audio",
    name: "Audio Production",
    icon: "🎧",
    color: "#14B8A6",
    description:
      "Sound design, effects, audio editing, mixing, mastering and production."
  },
  {
    id: "animation",
    name: "Animation",
    icon: "✨",
    color: "#E879F9",
    description:
      "2D and 3D animation, animated storytelling, motion graphics and visual development."
  },
  {
    id: "comedy",
    name: "Comedy & Entertainment",
    icon: "😂",
    color: "#FACC15",
    description:
      "Comedy writing, sketches, jokes, satire, entertainment concepts and humorous storytelling."
  },
  {
    id: "audiobooks",
    name: "Audiobook Production",
    icon: "📖",
    color: "#60A5FA",
    description:
      "Book narration, chapter production, audiobook editing and finished audio preparation."
  },
  {
    id: "research",
    name: "Research & Discovery",
    icon: "🔎",
    color: "#34D399",
    description:
      "Research, references, trends, facts, discovery, creative direction and source evaluation."
  }
];

/* -------------------------
   5. SHARED LIMITS
------------------------- */

const VALID_CHAT_ROLES = new Set<ChatRole>([
  "user",
  "assistant"
]);

const VALID_SELECTION_MODES =
  new Set<StudioSelectionMode>([
    "automatic",
    "manual",
    "combined"
  ]);

const VALID_MEMORY_ACTIONS =
  new Set<MemoryUpdate["action"]>([
    "save",
    "update",
    "delete"
  ]);

const VALID_DELIVERABLE_STATUSES =
  new Set<Deliverable["status"]>([
    "draft",
    "ready",
    "needs_review"
  ]);

/* -------------------------
   6. BASIC RESPONSE TYPES
------------------------- */

type ProviderRequestMessage = {
  role: ChatRole | "system";
  content: string;
};

type ProviderCallResult = {
  content: string;
  provider: AIProvider;
  model: string;
};

type RequestContext = {
  user: AuthenticatedUser;
  message: string;
  studio: Studio;
  projectId: string | null;
  history: ChatMessage[];
  studioContext: string;
  selectionMode: StudioSelectionMode;
  selectedStudios: string[];
};

type MemoryContext = {
  settings: MemorySettings;
  records: MemoryRecord[];
  contextText: string;
};

type ResearchResult = {
  requested: boolean;
  available: boolean;
  verified: boolean;
  sources: ResearchSource[];
};

/* =========================================================
   PART 2 — SECURITY, VALIDATION & AUTHENTICATION
   SECTION 1 OF 2
========================================================= */

/* -------------------------
   1. GENERAL HELPERS
------------------------- */

function safeString(
  value: unknown,
  maxLength = 1000
): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function createError(
  message: string,
  status = 400
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      success: false
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

function createSuccess<T>(
  data: T,
  headers: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      }
    }
  );
}

function getBearerToken(
  request: Request
): string | null {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization) return null;

  const match = authorization.match(
    /^Bearer\s+(.+)$/i
  );

  return match?.[1]?.trim() || null;
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

/* -------------------------
   2. STUDIO VALIDATION
------------------------- */

function getStudio(
  value: unknown
): Studio | undefined {
  const normalized = safeString(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (!normalized) return undefined;

  return STUDIOS.find((studio) => {
    const id = studio.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    const name = studio.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    return id === normalized || name === normalized;
  });
}

function validateStudio(
  studioId: unknown,
  studioName: unknown
): Studio | null {
  const byId = getStudio(studioId);
  const byName = getStudio(studioName);

  if (byId && byName && byId.id !== byName.id) {
    throw new Error(
      "The studio ID and studio name do not match."
    );
  }

  return byId ?? byName ?? null;
}

/* -------------------------
   3. MESSAGE VALIDATION
------------------------- */

function validateMessage(
  value: unknown
): string {
  if (typeof value !== "string") {
    throw new Error("A message is required.");
  }

  const message = value.trim();

  if (!message) {
    throw new Error("Your message cannot be empty.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Your message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`
    );
  }

  return message;
}

/* -------------------------
   4. CHAT HISTORY VALIDATION
------------------------- */

function validateHistory(
  value: unknown
): ChatMessage[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(
      "Conversation history must be an array."
    );
  }

  if (value.length > MAX_HISTORY_MESSAGES) {
    throw new Error(
      `Conversation history cannot exceed ${MAX_HISTORY_MESSAGES} messages.`
    );
  }

  const validated: ChatMessage[] = [];

  for (const item of value) {
    if (!isPlainObject(item)) {
      throw new Error(
        "A conversation history item is invalid."
      );
    }

    const role = item.role;
    const content = item.content;

    if (
      typeof role !== "string" ||
      !VALID_CHAT_ROLES.has(role as ChatRole)
    ) {
      throw new Error(
        "Conversation history contains an invalid role."
      );
    }

    if (typeof content !== "string") {
      throw new Error(
        "Conversation history contains invalid content."
      );
    }

    const cleanedContent = content.trim();

    if (!cleanedContent) continue;

    if (
      cleanedContent.length >
      MAX_HISTORY_MESSAGE_LENGTH
    ) {
      throw new Error(
        "A conversation history message is too long."
      );
    }

    validated.push({
      role: role as ChatRole,
      content: cleanedContent
    });
  }

  return validated;
}

/* -------------------------
   5. PROJECT VALIDATION
------------------------- */

function validateProjectId(
  value: unknown
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Project ID must be text.");
  }

  const projectId = value.trim();

  if (
    projectId.length > MAX_PROJECT_ID_LENGTH ||
    /[\u0000-\u001F\u007F]/.test(projectId)
  ) {
    throw new Error("Project ID is invalid.");
  }

  return projectId;
}

/* -------------------------
   6. STUDIO SELECTION VALIDATION
------------------------- */

function parseStudioSelectionMode(
  value: unknown
): StudioSelectionMode {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "automatic";
  }

  if (
    typeof value !== "string" ||
    !VALID_SELECTION_MODES.has(
      value as StudioSelectionMode
    )
  ) {
    throw new Error(
      "Studio selection mode must be automatic, manual, or combined."
    );
  }

  return value as StudioSelectionMode;
}

function parseSelectedStudios(
  value: unknown
): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(
      "Selected studios must be provided as an array."
    );
  }

  if (value.length > MAX_SELECTED_STUDIOS) {
    throw new Error(
      `You can select a maximum of ${MAX_SELECTED_STUDIOS} studios.`
    );
  }

  const selected: string[] = [];

  for (const item of value) {
    const studio = getStudio(item);

    if (!studio) {
      throw new Error(
        `Unknown studio selection: ${safeString(item, 100)}`
      );
    }

    if (!selected.includes(studio.id)) {
      selected.push(studio.id);
    }
  }

  return selected;
}

/* -------------------------
   7. STUDIO CONTEXT VALIDATION
------------------------- */

function validateStudioContext(
  value: unknown
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error(
      "Studio context must be text."
    );
  }

  return value.trim().slice(0, 12_000);
}

/* -------------------------
   8. REQUEST BODY VALIDATION
------------------------- */

function validateNYXRequest(
  value: unknown
): Omit<RequestContext, "user"> {
  if (!isPlainObject(value)) {
    throw new Error(
      "The request body must be a valid JSON object."
    );
  }

  const message = validateMessage(value.message);

  const studio = validateStudio(
    value.studioId,
    value.studioName
  );

  if (!studio) {
    throw new Error(
      "Choose a valid NYX studio before sending your request."
    );
  }

  const projectId = validateProjectId(
    value.projectId
  );

  const history = validateHistory(
    value.history
  );

  const studioContext = validateStudioContext(
    value.studioContext
  );

  const selectionMode = parseStudioSelectionMode(
    value.studioSelectionMode
  );

  const selectedStudios = parseSelectedStudios(
    value.selectedStudios
  );

  if (
    selectionMode === "manual" &&
    selectedStudios.length === 0
  ) {
    throw new Error(
      "Choose at least one studio when using manual selection."
    );
  }

  return {
    message,
    studio,
    projectId,
    history,
    studioContext,
    selectionMode,
    selectedStudios
  };
}

/* =========================================================
   PART 2 — SECURITY, VALIDATION & AUTHENTICATION
   SECTION 2 OF 2
========================================================= */

/* -------------------------
   9. ENVIRONMENT VALIDATION
------------------------- */

function validateEnvironment(): void {
  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase configuration: ${missing.join(", ")}`
    );
  }

  try {
    new URL(SUPABASE_URL);
  } catch {
    throw new Error("SUPABASE_URL is invalid.");
  }
}

/* -------------------------
   10. ORIGIN VALIDATION
------------------------- */

function validateRequestOrigin(
  request: Request
): boolean {
  const origin = request.headers.get("Origin");

  // Some non-browser clients do not send an Origin header.
  if (!origin) return true;

  return ALLOWED_ORIGINS.has(origin);
}

/* -------------------------
   11. SUPABASE CLIENT
------------------------- */

function createUserSupabaseClient(
  accessToken: string
) {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}

/* -------------------------
   12. AUTHENTICATE REQUEST
------------------------- */

async function authenticateRequest(
  request: Request
): Promise<{
  client: ReturnType<typeof createUserSupabaseClient>;
  user: AuthenticatedUser;
}> {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error(
      "Authentication required. Please sign in again."
    );
  }

  if (token.length > 10_000) {
    throw new Error("Invalid authentication token.");
  }

  const client = createUserSupabaseClient(token);

  const {
    data,
    error
  } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new Error(
      "Your session is invalid or expired. Please sign in again."
    );
  }

  return {
    client,
    user: {
      id: data.user.id,
      email: data.user.email ?? undefined
    }
  };
}

/* -------------------------
   13. VERIFY PROJECT OWNERSHIP
------------------------- */

/**
 * Project ownership is checked against the existing
 * projects table. If your actual project table or ownership
 * column has a different name, it must be confirmed before
 * enabling this check in production.
 *
 * Never trust a project ID supplied by the browser alone.
 */

async function verifyProjectOwnership(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null
): Promise<void> {
  if (!projectId) return;

  const {
    data,
    error
  } = await client
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Unable to verify project access. Please try again."
    );
  }

  if (!data) {
    throw new Error(
      "You do not have permission to access this project."
    );
  }
}

/* -------------------------
   14. SAFE MEMORY SETTINGS DEFAULT
------------------------- */

const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  enabled: true,
  allowPersonalMemory: true,
  allowProjectMemory: true
};

function validateMemorySettings(
  value: unknown
): MemorySettings {
  if (!isPlainObject(value)) {
    return { ...DEFAULT_MEMORY_SETTINGS };
  }

  return {
    enabled:
      typeof value.enabled === "boolean"
        ? value.enabled
        : DEFAULT_MEMORY_SETTINGS.enabled,

    allowPersonalMemory:
      typeof value.allowPersonalMemory === "boolean"
        ? value.allowPersonalMemory
        : DEFAULT_MEMORY_SETTINGS.allowPersonalMemory,

    allowProjectMemory:
      typeof value.allowProjectMemory === "boolean"
        ? value.allowProjectMemory
        : DEFAULT_MEMORY_SETTINGS.allowProjectMemory
  };
}

/* -------------------------
   15. SAFE DATABASE ERROR HANDLING
------------------------- */

function isMissingTableError(
  error: { code?: string } | null
): boolean {
  return error?.code === "42P01" ||
    error?.code === "PGRST205";
}

function isDuplicateRecordError(
  error: { code?: string } | null
): boolean {
  return error?.code === "23505";
}

function isPermissionError(
  error: { code?: string } | null
): boolean {
  return error?.code === "42501" ||
    error?.code === "PGRST301";
}

/* -------------------------
   16. USER-SCOPED DATABASE ACCESS
------------------------- */

async function getAuthenticatedProfile(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string
): Promise<{
  id: string;
  email?: string;
}> {
  const {
    data,
    error
  } = await client.auth.getUser();

  if (error || !data.user || data.user.id !== userId) {
    throw new Error(
      "Account verification failed. Please sign in again."
    );
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined
  };
}

/* -------------------------
   17. REQUEST CONTEXT BUILDER
------------------------- */

async function buildRequestContext(
  request: Request,
  body: unknown
): Promise<{
  client: ReturnType<typeof createUserSupabaseClient>;
  context: RequestContext;
}> {
  validateEnvironment();

  if (!validateRequestOrigin(request)) {
    throw new Error(
      "This application origin is not allowed."
    );
  }

  const {
    client,
    user
  } = await authenticateRequest(request);

  const validated = validateNYXRequest(body);

  await getAuthenticatedProfile(client, user.id);

  await verifyProjectOwnership(
    client,
    user.id,
    validated.projectId
  );

  return {
    client,
    context: {
      user,
      ...validated
    }
  };
}

/* -------------------------
   18. SAFE ERROR MESSAGE
------------------------- */

function getSafeErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    const message = error.message;

    if (
      message.includes("Authentication required") ||
      message.includes("session") ||
      message.includes("permission") ||
      message.includes("Choose") ||
      message.includes("message") ||
      message.includes("studio") ||
      message.includes("Project ID") ||
      message.includes("origin")
    ) {
      return message;
    }
  }

  return "NYX could not complete this request. Please try again.";
}

/* =========================================================
   PART 3 — STUDIO INTELLIGENCE & ORCHESTRATION
   SECTION 1 OF 2
========================================================= */

/* -------------------------
   1. STUDIO KNOWLEDGE
------------------------- */

const STUDIO_KEYWORDS: Record<string, string[]> = {
  film: [
    "film", "movie", "cinema", "screenplay", "script",
    "scene", "director", "cinematography", "trailer",
    "short film", "video production", "visual storytelling"
  ],

  music: [
    "music", "song", "beat", "melody", "instrumental",
    "lyrics", "album", "soundtrack", "compose",
    "composition", "music production"
  ],

  books: [
    "book", "novel", "ebook", "chapter", "writing",
    "author", "manuscript", "publish", "editing",
    "story", "fiction", "nonfiction"
  ],

  voice: [
    "voice", "voiceover", "dialogue", "character voice",
    "accent", "pitch", "narration", "speech",
    "voice acting", "voice sample", "voice recording"
  ],

  games: [
    "game", "gaming", "gameplay", "player", "level",
    "quest", "game design", "game mechanics",
    "game world", "interactive story"
  ],

  marketing: [
    "marketing", "advert", "advertising", "campaign",
    "brand", "promotion", "social media", "audience",
    "product launch", "content strategy"
  ],

  characters: [
    "character", "characters", "personality",
    "backstory", "character design", "hero",
    "villain", "protagonist", "antagonist",
    "character development"
  ],

  audio: [
    "audio", "sound effects", "sfx", "podcast",
    "mixing", "mastering", "sound design",
    "background sound", "audio editing"
  ],

  animation: [
    "animation", "animated", "cartoon", "2d", "3d",
    "motion graphics", "animate", "visual effects",
    "animated film"
  ],

  comedy: [
    "comedy", "funny", "joke", "humour", "humor",
    "sketch", "satire", "parody", "stand up",
    "comic scene"
  ],

  audiobooks: [
    "audiobook", "audio book", "book narration",
    "narrate a book", "chapter audio",
    "audiobook production", "listen to my book"
  ],

  research: [
    "research", "investigate", "discover",
    "references", "trends", "facts", "sources",
    "inspiration", "market research",
    "creative research", "reference material"
  ]
};

/* -------------------------
   2. STUDIO COLLABORATION
   Dependencies describe useful
   working relationships, not
   automatic execution.
------------------------- */

const STUDIO_DEPENDENCIES: Record<string, string[]> = {
  film: [
    "research", "characters", "voice",
    "audio", "music", "animation"
  ],

  music: [
    "research", "voice", "audio", "marketing"
  ],

  books: [
    "research", "characters", "audiobooks",
    "marketing", "voice"
  ],

  voice: [
    "research", "characters", "audio",
    "books", "audiobooks"
  ],

  games: [
    "research", "characters", "music",
    "audio", "animation", "voice"
  ],

  marketing: [
    "research", "characters", "voice",
    "audio", "film", "music"
  ],

  characters: [
    "research", "voice", "film",
    "games", "animation", "books"
  ],

  audio: [
    "research", "music", "voice",
    "film", "games", "animation"
  ],

  animation: [
    "research", "characters", "film",
    "voice", "music", "audio"
  ],

  comedy: [
    "research", "characters", "books",
    "film", "voice", "marketing"
  ],

  audiobooks: [
    "research", "books", "voice", "audio"
  ],

  research: [
    "film", "music", "books", "voice",
    "games", "marketing", "characters",
    "audio", "animation", "comedy",
    "audiobooks"
  ]
};

/* -------------------------
   3. NORMALIZE REQUEST TEXT
------------------------- */

function normalizeStudioKeywordText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* -------------------------
   4. KEYWORD MATCHING
------------------------- */

function getStudioMatchScore(
  message: string,
  studioId: string
): number {
  const normalizedMessage =
    ` ${normalizeStudioKeywordText(message)} `;

  const keywords = STUDIO_KEYWORDS[studioId] ?? [];

  let score = 0;

  for (const keyword of keywords) {
    const normalizedKeyword =
      normalizeStudioKeywordText(keyword);

    if (!normalizedKeyword) continue;

    if (
      normalizedMessage.includes(
        ` ${normalizedKeyword} `
      )
    ) {
      score += normalizedKeyword.includes(" ") ? 4 : 2;
    }
  }

  return score;
}

/* -------------------------
   5. RECOMMENDATION REASONS
------------------------- */

function getStudioRecommendationReason(
  studioId: string,
  message: string,
  leadStudioId: string
): string {
  const studio = getStudio(studioId);
  const lead = getStudio(leadStudioId);

  if (!studio) {
    return "This studio could not be identified.";
  }

  if (studioId === leadStudioId) {
    return `${studio.name} is leading the project because it is the creator's selected main studio.`;
  }

  const normalizedMessage =
    normalizeStudioKeywordText(message);

  const matchedKeyword =
    (STUDIO_KEYWORDS[studioId] ?? []).find(
      (keyword) =>
        normalizedMessage.includes(
          normalizeStudioKeywordText(keyword)
        )
    );

  if (matchedKeyword) {
    return `${studio.name} is recommended because your request relates to ${matchedKeyword}.`;
  }

  const leadDependencies =
    STUDIO_DEPENDENCIES[leadStudioId] ?? [];

  if (leadDependencies.includes(studioId)) {
    return `${studio.name} can provide supporting work for ${lead?.name ?? "the main studio"}.`;
  }

  if (studioId === "research") {
    return "Research can provide references, facts, trends and creative direction to strengthen this project.";
  }

  return `${studio.name} may contribute a useful supporting capability to this project.`;
}

/* -------------------------
   6. AUTOMATIC STUDIO DISCOVERY
------------------------- */

function detectSupportingStudios(
  message: string,
  leadStudioId: string
): string[] {
  const scored: Array<{
    studioId: string;
    score: number;
  }> = [];

  for (const studio of STUDIOS) {
    if (studio.id === leadStudioId) continue;

    const score = getStudioMatchScore(
      message,
      studio.id
    );

    if (score > 0) {
      scored.push({
        studioId: studio.id,
        score
      });
    }
  }

  const dependencies =
    STUDIO_DEPENDENCIES[leadStudioId] ?? [];

  for (const dependency of dependencies) {
    const existing = scored.find(
      (item) => item.studioId === dependency
    );

    if (existing) {
      existing.score += 1;
    }
  }

  // Research is available as a supporting capability
  // across every studio workflow.
  const researchMatch = scored.find(
    (item) => item.studioId === "research"
  );

  if (researchMatch) {
    researchMatch.score += 2;
  }

  return scored
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, MAX_SELECTED_STUDIOS - 1))
    .map((item) => item.studioId);
}

/* =========================================================
   PART 3 — STUDIO INTELLIGENCE & ORCHESTRATION
   SECTION 2 OF 2
========================================================= */

/* -------------------------
   7. COMBINE CREATOR CHOICES
   WITH NYX RECOMMENDATIONS
------------------------- */

function mergeStudioSelections(
  leadStudioId: string,
  creatorSelections: string[],
  recommendations: string[],
  mode: StudioSelectionMode
): string[] {
  const selected: string[] = [leadStudioId];

  function addStudio(studioId: string): void {
    const studio = getStudio(studioId);

    if (!studio) return;
    if (selected.includes(studio.id)) return;
    if (selected.length >= MAX_SELECTED_STUDIOS) return;

    selected.push(studio.id);
  }

  if (mode === "manual") {
    for (const studioId of creatorSelections) {
      addStudio(studioId);
    }
  }

  if (mode === "automatic") {
    for (const studioId of recommendations) {
      addStudio(studioId);
    }
  }

  if (mode === "combined") {
    // Creator's choices take priority.
    for (const studioId of creatorSelections) {
      addStudio(studioId);
    }

    // NYX adds relevant supporting studios.
    for (const studioId of recommendations) {
      addStudio(studioId);
    }
  }

  return selected;
}

/* -------------------------
   8. BUILD STUDIO RESPONSIBILITIES
------------------------- */

function buildStudioResponsibilities(
  selectedStudios: string[],
  leadStudioId: string
): Record<string, string[]> {
  const responsibilities: Record<string, string[]> = {};

  for (const studioId of selectedStudios) {
    const studio = getStudio(studioId);

    if (!studio) continue;

    if (studioId === leadStudioId) {
      responsibilities[studioId] = [
        "Lead the creator's main request.",
        "Maintain the central creative direction.",
        "Coordinate the selected supporting studios.",
        "Review contributions before they are combined.",
        "Respect the creator's instructions and approval decisions."
      ];

      continue;
    }

    responsibilities[studioId] = [
      `Contribute specialist work using the capabilities of ${studio.name}.`,
      "Follow the shared project brief and creator instructions.",
      "Share relevant findings, references and approved assets.",
      "Report work requiring creator review or approval."
    ];
  }

  return responsibilities;
}

/* -------------------------
   9. BUILD RECOMMENDATION REASONS
------------------------- */

function buildStudioReasons(
  selectedStudios: string[],
  message: string,
  leadStudioId: string,
  creatorSelections: string[]
): Record<string, string> {
  const reasons: Record<string, string> = {};

  for (const studioId of selectedStudios) {
    if (creatorSelections.includes(studioId)) {
      const studio = getStudio(studioId);

      reasons[studioId] =
        studioId === leadStudioId
          ? `${studio?.name ?? "This studio"} was chosen as the main studio by the creator.`
          : `${studio?.name ?? "This studio"} was explicitly selected by the creator.`;

      continue;
    }

    reasons[studioId] = getStudioRecommendationReason(
      studioId,
      message,
      leadStudioId
    );
  }

  return reasons;
}

/* -------------------------
   10. WORKFLOW ORDER
------------------------- */

/**
 * Creates a dependency-aware execution order.
 * This is a planning sequence, not proof that studios
 * have actually executed work.
 */

function buildStudioWorkflowOrder(
  selectedStudios: string[],
  leadStudioId: string
): string[] {
  const ordered: string[] = [];
  const visited = new Set<string>();

  function visit(studioId: string): void {
    if (visited.has(studioId)) return;

    visited.add(studioId);

    const dependencies =
      STUDIO_DEPENDENCIES[studioId] ?? [];

    for (const dependency of dependencies) {
      if (
        selectedStudios.includes(dependency) &&
        dependency !== leadStudioId
      ) {
        visit(dependency);
      }
    }

    if (studioId !== leadStudioId) {
      ordered.push(studioId);
    }
  }

  for (const studioId of selectedStudios) {
    if (studioId !== leadStudioId) {
      visit(studioId);
    }
  }

  // The lead studio coordinates the completed contributions.
  ordered.push(leadStudioId);

  return [...new Set(ordered)];
}

/* -------------------------
   11. BUILD ORCHESTRATION
------------------------- */

function buildOrchestration(
  input: Pick<
    RequestContext,
    | "message"
    | "studio"
    | "selectionMode"
    | "selectedStudios"
  >
): Orchestration {
  const leadStudioId = input.studio.id;

  const recommendations = detectSupportingStudios(
    input.message,
    leadStudioId
  );

  const selectedStudios = mergeStudioSelections(
    leadStudioId,
    input.selectedStudios,
    recommendations,
    input.selectionMode
  );

  const supportingStudios = selectedStudios.filter(
    (studioId) => studioId !== leadStudioId
  );

  const responsibilities = buildStudioResponsibilities(
    selectedStudios,
    leadStudioId
  );

  const reasons = buildStudioReasons(
    selectedStudios,
    input.message,
    leadStudioId,
    input.selectedStudios
  );

  return {
    mode: input.selectionMode,
    leadStudio: leadStudioId,
    selectedStudios,
    supportingStudios,
    responsibilities,
    reasons,
    executionStatus: "planned"
  };
}

/* -------------------------
   12. FORMAT SHARED PROJECT
   CONTEXT FOR THE AI
------------------------- */

function formatOrchestrationContext(
  orchestration: Orchestration
): string {
  const lines: string[] = [
    "NYX CENTRAL STUDIO COORDINATION",
    "",
    `Selection mode: ${orchestration.mode}`,
    `Lead studio: ${orchestration.leadStudio}`,
    `Execution status: ${orchestration.executionStatus}`,
    "",
    "SELECTED STUDIOS"
  ];

  for (const studioId of orchestration.selectedStudios) {
    const studio = getStudio(studioId);

    if (!studio) continue;

    lines.push("");
    lines.push(`${studio.name} (${studio.id})`);

    lines.push(
      `Role: ${
        studioId === orchestration.leadStudio
          ? "Lead studio"
          : "Supporting studio"
      }`
    );

    lines.push(
      `Reason: ${orchestration.reasons[studioId] ?? "Creator selection"}`
    );

    const tasks =
      orchestration.responsibilities[studioId] ?? [];

    for (const task of tasks) {
      lines.push(`- ${task}`);
    }
  }

  const workflowOrder = buildStudioWorkflowOrder(
    orchestration.selectedStudios,
    orchestration.leadStudio
  );

  lines.push("");
  lines.push("PROPOSED WORKFLOW ORDER");

  workflowOrder.forEach((studioId, index) => {
    const studio = getStudio(studioId);

    lines.push(
      `${index + 1}. ${studio?.name ?? studioId}`
    );
  });

  lines.push("");
  lines.push("COLLABORATION RULES");
  lines.push(
    "- All selected studios work from the same project brief."
  );
  lines.push(
    "- Share only relevant project context and approved assets."
  );
  lines.push(
    "- Preserve the creator's original instructions."
  );
  lines.push(
    "- Respect creator permissions and approval requirements."
  );
  lines.push(
    "- Do not silently add studios in manual selection mode."
  );
  lines.push(
    "- Do not claim a studio has completed work without confirmation from an actual execution service."
  );
  lines.push(
    "- Ask for creator approval before consequential or irreversible actions."
  );

  return lines.join("\n");
}

/* -------------------------
   13. CREATOR CONTROL SUMMARY
------------------------- */

function formatCreatorStudioChoices(
  orchestration: Orchestration
): string {
  const lines: string[] = [
    "CREATOR STUDIO CONTROL",
    `Mode: ${orchestration.mode}`,
    `Main studio: ${orchestration.leadStudio}`,
    `Selected studios: ${orchestration.selectedStudios.length}`,
    "",
    "The creator controls the studio selection.",
    "NYX must respect the selected mode."
  ];

  if (orchestration.mode === "manual") {
    lines.push(
      "Manual mode: use only the creator's selected studios."
    );
  }

  if (orchestration.mode === "automatic") {
    lines.push(
      "Automatic mode: NYX chooses relevant supporting studios."
    );
  }

  if (orchestration.mode === "combined") {
    lines.push(
      "Combined mode: preserve creator choices and add relevant NYX recommendations."
    );
  }

  return lines.join("\n");
}

/* =========================================================
   PART 4 — RESEARCH, MEMORY & CREATOR PRIVACY
   SECTION 1 OF 2
========================================================= */

/* -------------------------
   1. RESEARCH DETECTION
------------------------- */

const RESEARCH_KEYWORDS = [
  "research",
  "investigate",
  "find sources",
  "find references",
  "look up",
  "verify",
  "check the facts",
  "current information",
  "latest trends",
  "market research",
  "competitor research",
  "discover",
  "fact check",
  "evidence",
  "statistics",
  "inspiration",
  "reference images",
  "reference material"
];

function detectResearchRequest(
  message: string
): boolean {
  const normalized =
    normalizeStudioKeywordText(message);

  return RESEARCH_KEYWORDS.some((keyword) =>
    normalized.includes(
      normalizeStudioKeywordText(keyword)
    )
  );
}

/* -------------------------
   2. RESEARCH REQUIREMENTS
------------------------- */

function buildResearchInstructions(
  message: string,
  studio: Studio
): string {
  return [
    "NYX RESEARCH AND DISCOVERY REQUIREMENTS",
    "",
    `Main studio: ${studio.name}`,
    `Creator request: ${message}`,
    "",
    "Research should support the actual needs of the selected studio.",
    "",
    "Research may include:",
    "- Relevant facts and background information.",
    "- References and creative inspiration.",
    "- Current trends, where current information is available.",
    "- Styles, genres and creative approaches.",
    "- Intended audiences and audience expectations.",
    "- Relevant assets and reference material.",
    "- Competitors and market context when relevant.",
    "- Source quality, limitations and uncertainty.",
    "",
    "RESEARCH RULES",
    "- Do not invent research findings, statistics or sources.",
    "- Distinguish verified facts from assumptions and creative suggestions.",
    "- Explain when information may be outdated.",
    "- Do not claim to have browsed the live internet unless a research provider actually supplied results.",
    "- Give the creator useful research questions when evidence is unavailable.",
    "- Share relevant research context with every selected studio."
  ].join("\n");
}

/* -------------------------
   3. RESEARCH RESULT DEFAULT
------------------------- */

/**
 * No live research provider is connected by this section.
 * This prevents NYX from pretending it has verified sources.
 */

function createResearchResult(
  requested: boolean
): ResearchResult {
  return {
    requested,
    available: false,
    verified: false,
    sources: []
  };
}

/* -------------------------
   4. RESEARCH CONTEXT FORMAT
------------------------- */

function formatResearchContext(
  research: ResearchResult
): string {
  if (!research.requested) {
    return "No explicit live research request was detected.";
  }

  if (!research.available) {
    return [
      "RESEARCH REQUEST DETECTED",
      "Live research is not currently connected.",
      "Do not invent sources or claim that live research has been completed.",
      "Provide a research plan, identify useful questions, and clearly label unverified information."
    ].join("\n");
  }

  const lines = [
    "RESEARCH RESULTS",
    `Verified: ${research.verified ? "Yes" : "No"}`
  ];

  for (const source of research.sources) {
    lines.push("");
    lines.push(`Title: ${source.title}`);
    lines.push(`URL: ${source.url}`);
    lines.push(`Description: ${source.description}`);
    lines.push(`Verified: ${source.verified ? "Yes" : "No"}`);
  }

  return lines.join("\n");
}

/* -------------------------
   5. MEMORY SETTINGS RETRIEVAL
------------------------- */

async function getMemorySettings(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string
): Promise<MemorySettings> {
  const {
    data,
    error
  } = await client
    .from(MEMORY_SETTINGS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return {
        enabled: false,
        allowPersonalMemory: false,
        allowProjectMemory: false
      };
    }

    throw new Error(
      "Unable to load your memory settings."
    );
  }

  if (!data) {
    return { ...DEFAULT_MEMORY_SETTINGS };
  }

  return validateMemorySettings({
    enabled: data.enabled,
    allowPersonalMemory:
      data.allow_personal_memory,
    allowProjectMemory:
      data.allow_project_memory
  });
}

/* -------------------------
   6. MEMORY RECORD VALIDATION
------------------------- */

function validateMemoryRecord(
  value: unknown
): MemoryRecord | null {
  if (!isPlainObject(value)) return null;

  if (
    typeof value.id !== "string" ||
    typeof value.user_id !== "string" ||
    typeof value.content !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    user_id: value.user_id,
    project_id:
      typeof value.project_id === "string"
        ? value.project_id
        : null,
    category:
      typeof value.category === "string"
        ? safeString(value.category, 100)
        : "general",
    content: safeString(value.content, 3000),
    created_at:
      typeof value.created_at === "string"
        ? value.created_at
        : undefined,
    updated_at:
      typeof value.updated_at === "string"
        ? value.updated_at
        : undefined
  };
}

/* -------------------------
   7. PERSONAL MEMORY RETRIEVAL
------------------------- */

async function getPersonalMemory(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string
): Promise<MemoryRecord[]> {
  const {
    data,
    error
  } = await client
    .from(SHARED_MEMORY_TABLE)
    .select("*")
    .eq("user_id", userId)
    .is("project_id", null)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    if (isMissingTableError(error)) return [];

    throw new Error(
      "Unable to retrieve your personal memory."
    );
  }

  return (data ?? [])
    .map(validateMemoryRecord)
    .filter(
      (record): record is MemoryRecord =>
        record !== null
    );
}

/* -------------------------
   8. PROJECT MEMORY RETRIEVAL
------------------------- */

async function getProjectMemory(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string
): Promise<MemoryRecord[]> {
  const {
    data,
    error
  } = await client
    .from(SHARED_MEMORY_TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingTableError(error)) return [];

    throw new Error(
      "Unable to retrieve project memory."
    );
  }

  return (data ?? [])
    .map(validateMemoryRecord)
    .filter(
      (record): record is MemoryRecord =>
        record !== null
    );
}

/* -------------------------
   9. MEMORY CONTEXT FORMAT
------------------------- */

function formatMemoryContext(
  records: MemoryRecord[]
): string {
  if (records.length === 0) {
    return "No saved memory is available for this request.";
  }

  const lines = [
    "RELEVANT CREATOR MEMORY",
    "Use this information only when relevant to the current request.",
    "Do not expose private memory unnecessarily."
  ];

  for (const record of records) {
    lines.push("");
    lines.push(`Category: ${record.category ?? "general"}`);
    lines.push(`Memory: ${record.content ?? ""}`);
  }

  return lines.join("\n");
}

/* -------------------------
   10. LOAD MEMORY CONTEXT
------------------------- */

async function loadMemoryContext(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null
): Promise<MemoryContext> {
  const settings = await getMemorySettings(
    client,
    userId
  );

  if (!settings.enabled) {
    return {
      settings,
      records: [],
      contextText: "Creator memory is disabled."
    };
  }

  const records: MemoryRecord[] = [];

  if (settings.allowPersonalMemory) {
    const personal = await getPersonalMemory(
      client,
      userId
    );

    records.push(...personal);
  }

  if (
    settings.allowProjectMemory &&
    projectId
  ) {
    const project = await getProjectMemory(
      client,
      userId,
      projectId
    );

    records.push(...project);
  }

  return {
    settings,
    records,
    contextText: formatMemoryContext(records)
  };
}

/* -------------------------
   11. MEMORY PRIVACY RULES
------------------------- */

function buildMemoryPrivacyInstructions(
  settings: MemorySettings
): string {
  return [
    "NYX MEMORY AND PRIVACY RULES",
    `Memory enabled: ${settings.enabled}`,
    `Personal memory allowed: ${settings.allowPersonalMemory}`,
    `Project memory allowed: ${settings.allowProjectMemory}`,
    "",
    "Rules:",
    "- Never retrieve another user's memory.",
    "- Never mix unrelated users' project memory.",
    "- Do not save passwords, authentication tokens or payment credentials.",
    "- Do not save sensitive personal information without an explicit, appropriate request.",
    "- Do not treat temporary conversation details as permanent preferences.",
    "- Respect memory settings and deletion requests.",
    "- Do not claim information has been saved unless the database operation succeeds."
  ].join("\n");
}

/* =========================================================
   PART 4 — RESEARCH, MEMORY & CREATOR PRIVACY
   SECTION 2 OF 2
========================================================= */

/* -------------------------
   12. EXPLICIT MEMORY INTENT
------------------------- */

type ExplicitMemoryIntent =
  | "save"
  | "update"
  | "delete"
  | "none";

function detectExplicitMemoryIntent(
  message: string
): ExplicitMemoryIntent {
  const text = normalizeStudioKeywordText(message);

  // Refuse ambiguous or negative memory instructions.
  const refusalPatterns = [
    /\b(dont|do not|never|stop)\s+(save|store|remember|keep)\b/,
    /\b(dont|do not)\s+(want|wish)\s+(you to )?(save|remember|store)\b/,
    /\b(no memory|without saving|do not keep this)\b/
  ];

  if (
    refusalPatterns.some((pattern) =>
      pattern.test(text)
    )
  ) {
    return "none";
  }

  const deletePatterns = [
    /\b(delete|remove|erase|forget)\b.*\b(memory|memories|saved information|saved detail)\b/,
    /\b(forget|erase|delete|remove)\s+that\b/
  ];

  if (
    deletePatterns.some((pattern) =>
      pattern.test(text)
    )
  ) {
    return "delete";
  }

  const updatePatterns = [
    /\b(update|change|replace|correct)\b.*\b(memory|memories|saved information|saved detail)\b/,
    /\bremember instead\b/
  ];

  if (
    updatePatterns.some((pattern) =>
      pattern.test(text)
    )
  ) {
    return "update";
  }

  const savePatterns = [
    /\b(remember|save|store|keep)\b.*\b(this|that|these|my preference|for future|going forward|from now on)\b/,
    /\b(add|put)\b.*\b(to memory|in memory)\b/,
    /\bremember that\b/
  ];

  if (
    savePatterns.some((pattern) =>
      pattern.test(text)
    )
  ) {
    return "save";
  }

  return "none";
}

/* -------------------------
   13. VALIDATE MEMORY CONTENT
------------------------- */

function validateMemoryContent(
  value: unknown
): string | null {
  if (typeof value !== "string") return null;

  const content = safeString(value, 3000);

  if (content.length < 3) return null;

  const sensitivePatterns = [
    /\bpassword\b/i,
    /\bpasscode\b/i,
    /\bverification code\b/i,
    /\baccess token\b/i,
    /\bsecret key\b/i,
    /\bcredit card number\b/i
  ];

  if (
    sensitivePatterns.some((pattern) =>
      pattern.test(content)
    )
  ) {
    return null;
  }

  return content;
}

/* -------------------------
   14. PREPARE MEMORY UPDATE
------------------------- */

function prepareMemoryUpdate(
  input: unknown,
  explicitIntent: ExplicitMemoryIntent,
  settings: MemorySettings
): MemoryUpdate | null {
  if (
    explicitIntent === "none" ||
    !settings.enabled
  ) {
    return null;
  }

  if (!isPlainObject(input)) return null;

  const action = input.action;

  if (
    action !== explicitIntent ||
    !VALID_MEMORY_ACTIONS.has(action)
  ) {
    return null;
  }

  if (
    action === "save" ||
    action === "update"
  ) {
    const content = validateMemoryContent(
      input.content
    );

    if (!content) return null;

    const category = safeString(
      typeof input.category === "string"
        ? input.category
        : "general",
      100
    );

    return {
      action,
      content,
      category,
      id:
        typeof input.id === "string"
          ? input.id
          : undefined
    } as MemoryUpdate;
  }

  if (action === "delete") {
    return {
      action,
      id:
        typeof input.id === "string"
          ? input.id
          : undefined
    } as MemoryUpdate;
  }

  return null;
}

/* -------------------------
   15. SAVE MEMORY
------------------------- */

async function saveCreatorMemory(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null,
  update: MemoryUpdate,
  settings: MemorySettings
): Promise<MemoryRecord> {
  if (!settings.enabled) {
    throw new Error("Memory is disabled.");
  }

  const isProjectMemory = projectId !== null;

  if (
    isProjectMemory &&
    !settings.allowProjectMemory
  ) {
    throw new Error(
      "Project memory is not permitted."
    );
  }

  if (
    !isProjectMemory &&
    !settings.allowPersonalMemory
  ) {
    throw new Error(
      "Personal memory is not permitted."
    );
  }

  const content = validateMemoryContent(
    update.content
  );

  if (!content) {
    throw new Error("Invalid memory content.");
  }

  const payload = {
    user_id: userId,
    project_id: projectId,
    category: safeString(
      update.category ?? "general",
      100
    ),
    content
  };

  const { data, error } = await client
    .from(SHARED_MEMORY_TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      "Unable to save memory. Please check the memory database configuration."
    );
  }

  const record = validateMemoryRecord(data);

  if (!record) {
    throw new Error(
      "The saved memory could not be verified."
    );
  }

  return record;
}

/* -------------------------
   16. UPDATE EXISTING MEMORY
------------------------- */

async function updateCreatorMemory(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null,
  update: MemoryUpdate,
  settings: MemorySettings
): Promise<MemoryRecord> {
  if (!settings.enabled) {
    throw new Error("Memory is disabled.");
  }

  if (!update.id || !isValidUUID(update.id)) {
    throw new Error(
      "A valid memory record ID is required."
    );
  }

  if (
    projectId &&
    !settings.allowProjectMemory
  ) {
    throw new Error(
      "Project memory is not permitted."
    );
  }

  if (
    !projectId &&
    !settings.allowPersonalMemory
  ) {
    throw new Error(
      "Personal memory is not permitted."
    );
  }

  const content = validateMemoryContent(
    update.content
  );

  if (!content) {
    throw new Error("Invalid memory content.");
  }

  let query = client
    .from(SHARED_MEMORY_TABLE)
    .update({
      content,
      category: safeString(
        update.category ?? "general",
        100
      )
    })
    .eq("id", update.id)
    .eq("user_id", userId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  } else {
    query = query.is("project_id", null);
  }

  const { data, error } = await query
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Memory was not updated. The record may not exist or may not belong to this account."
    );
  }

  const record = validateMemoryRecord(data);

  if (!record) {
    throw new Error(
      "The updated memory could not be verified."
    );
  }

  return record;
}

/* -------------------------
   17. DELETE MEMORY
------------------------- */

async function deleteCreatorMemory(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null,
  update: MemoryUpdate,
  settings: MemorySettings
): Promise<boolean> {
  if (!settings.enabled) {
    throw new Error("Memory is disabled.");
  }

  if (!update.id || !isValidUUID(update.id)) {
    throw new Error(
      "A valid memory record ID is required."
    );
  }

  if (
    projectId &&
    !settings.allowProjectMemory
  ) {
    throw new Error(
      "Project memory is not permitted."
    );
  }

  if (
    !projectId &&
    !settings.allowPersonalMemory
  ) {
    throw new Error(
      "Personal memory is not permitted."
    );
  }

  let query = client
    .from(SHARED_MEMORY_TABLE)
    .delete()
    .eq("id", update.id)
    .eq("user_id", userId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  } else {
    query = query.is("project_id", null);
  }

  const { data, error } = await query
    .select("id");

  if (error) {
    throw new Error(
      "Unable to delete the requested memory."
    );
  }

  return Array.isArray(data) && data.length > 0;
}

/* -------------------------
   18. PROCESS MEMORY ACTION
------------------------- */

async function processCreatorMemoryAction(
  client: ReturnType<typeof createUserSupabaseClient>,
  userId: string,
  projectId: string | null,
  update: MemoryUpdate | null,
  settings: MemorySettings,
  explicitIntent: ExplicitMemoryIntent
): Promise<{
  success: boolean;
  action: ExplicitMemoryIntent;
  message: string;
}> {
  if (!update || explicitIntent === "none") {
    return {
      success: false,
      action: "none",
      message: "No memory change was requested."
    };
  }

  if (update.action !== explicitIntent) {
    return {
      success: false,
      action: "none",
      message: "Memory action did not match the creator's request."
    };
  }

  try {
    if (update.action === "save") {
      await saveCreatorMemory(
        client,
        userId,
        projectId,
        update,
        settings
      );

      return {
        success: true,
        action: "save",
        message: "Memory saved successfully."
      };
    }

    if (update.action === "update") {
      await updateCreatorMemory(
        client,
        userId,
        projectId,
        update,
        settings
      );

      return {
        success: true,
        action: "update",
        message: "Memory updated successfully."
      };
    }

    if (update.action === "delete") {
      const deleted = await deleteCreatorMemory(
        client,
        userId,
        projectId,
        update,
        settings
      );

      return {
        success: deleted,
        action: "delete",
        message: deleted
          ? "Memory deleted successfully."
          : "No matching memory record was found."
      };
    }

    return {
      success: false,
      action: "none",
      message: "Unsupported memory action."
    };
  } catch {
    return {
      success: false,
      action: update.action,
      message: "The memory operation could not be completed."
    };
  }
}

/* -------------------------
   19. MEMORY CONTROL PROMPT
------------------------- */

function buildMemoryActionInstructions(
  explicitIntent: ExplicitMemoryIntent
): string {
  return [
    "MEMORY ACTION AUTHORIZATION",
    `Creator's explicit memory intent: ${explicitIntent}`,
    "",
    "The AI must not independently authorize memory changes.",
    "Only prepare a memory action when it matches the explicit creator intent.",
    "Never invent a memory record ID.",
    "Never report a successful save, update or deletion before the database confirms it.",
    "If a deletion request does not identify which saved memory should be deleted, ask one clear follow-up question.",
    "If the creator requests that all memory be disabled, explain the available account memory controls rather than pretending that a single record deletion disables everything."
  ].join("\n");
}

/* =========================================================
   PART 5 — NYX CORE INTELLIGENCE ENGINE
   SECTION 1 OF 2
========================================================= */

/* -------------------------
   1. PROVIDER CONFIGURATION
------------------------- */

type NYXProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type NYXProviderResult = {
  content: string;
  provider: AIProvider;
  model: string;
};

class NYXProviderError extends Error {
  provider: AIProvider;
  status: number | null;

  constructor(
    message: string,
    provider: AIProvider,
    status: number | null = null
  ) {
    super(message);
    this.name = "NYXProviderError";
    this.provider = provider;
    this.status = status;
  }
}

function getProviderConfiguration(
  provider: AIProvider
): {
  url: string;
  key: string;
  model: string;
} {
  if (provider === "groq") {
    return {
      url: GROQ_URL,
      key: GROQ_API_KEY,
      model: GROQ_MODEL
    };
  }

  return {
    url: OPENROUTER_URL,
    key: OPENROUTER_API_KEY,
    model: OPENROUTER_MODEL
  };
}

/* -------------------------
   2. REQUEST TIMEOUT
------------------------- */

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error("AI provider request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------
   3. PROVIDER RESPONSE CHECK
------------------------- */

function extractProviderContent(
  payload: unknown
): string {
  if (!isPlainObject(payload)) {
    throw new Error("Invalid AI provider response.");
  }

  const choices = payload.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("AI provider returned no response.");
  }

  const firstChoice = choices[0];

  if (!isPlainObject(firstChoice)) {
    throw new Error("Invalid AI response choice.");
  }

  const message = firstChoice.message;

  if (!isPlainObject(message)) {
    throw new Error("AI response message is missing.");
  }

  const content = message.content;

  if (typeof content !== "string") {
    throw new Error("AI response content is invalid.");
  }

  const cleaned = content.trim();

  if (!cleaned) {
    throw new Error("AI provider returned an empty response.");
  }

  return cleaned;
}

/* -------------------------
   4. CALL AN AI PROVIDER
------------------------- */

async function callNYXProvider(
  provider: AIProvider,
  messages: NYXProviderMessage[]
): Promise<NYXProviderResult> {
  const configuration =
    getProviderConfiguration(provider);

  if (!configuration.key) {
    throw new NYXProviderError(
      `${provider} API key is not configured.`,
      provider
    );
  }

  const response = await fetchWithTimeout(
    configuration.url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${configuration.key}`,
        ...(provider === "openrouter"
          ? {
              "HTTP-Referer":
                "https://nyx-creative-universe.pages.dev",
              "X-Title": "NYX Creative Universe"
            }
          : {})
      },
      body: JSON.stringify({
        model: configuration.model,
        messages,
        temperature: 0.7,
        max_tokens: 5000,
        stream: false
      })
    }
  );

  if (!response.ok) {
    const status = response.status;

    let providerMessage =
      `AI provider returned HTTP ${status}.`;

    try {
      const errorPayload = await response.json();

      if (
        isPlainObject(errorPayload) &&
        isPlainObject(errorPayload.error) &&
        typeof errorPayload.error.message === "string"
      ) {
        providerMessage =
          safeString(errorPayload.error.message, 500);
      }
    } catch {
      // Keep the safe generic provider error.
    }

    throw new NYXProviderError(
      providerMessage,
      provider,
      status
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new NYXProviderError(
      "AI provider returned invalid JSON.",
      provider,
      response.status
    );
  }

  return {
    content: extractProviderContent(payload),
    provider,
    model: configuration.model
  };
}

/* -------------------------
   5. GROQ FIRST, OPENROUTER FALLBACK
------------------------- */

function canUseFallback(
  error: unknown
): boolean {
  if (!(error instanceof NYXProviderError)) {
    return true;
  }

  if (
    error.status === 400 ||
    error.status === 401 ||
    error.status === 403
  ) {
    return false;
  }

  return true;
}

async function runNYXIntelligence(
  messages: NYXProviderMessage[]
): Promise<NYXProviderResult> {
  if (GROQ_API_KEY) {
    try {
      return await callNYXProvider(
        "groq",
        messages
      );
    } catch (error) {
      if (
        !canUseFallback(error) ||
        !OPENROUTER_API_KEY
      ) {
        throw error;
      }
    }
  }

  if (OPENROUTER_API_KEY) {
    return await callNYXProvider(
      "openrouter",
      messages
    );
  }

  throw new Error(
    "No AI provider is configured. Add GROQ_API_KEY or OPENROUTER_API_KEY."
  );
}

/* -------------------------
   6. NYX CORE IDENTITY
------------------------- */

function buildNYXSystemPrompt(): string {
  return `
You are NYX CORE, the central intelligence of NYX Creative Universe.

You are not a basic chatbot and you are not a collection of disconnected tools.

You coordinate creative work, understand the creator's intention,
recommend the right studios, organize workflows and help turn ideas
into complete creative projects.

IDENTITY AND BEHAVIOUR

1. Understand the creator's actual intention before proposing work.
2. Be warm, intelligent, natural and emotionally aware.
3. Adapt your communication to the creator's tone and situation.
4. Use humour only when appropriate.
5. Be direct without being rude.
6. Do not overwhelm the creator with unnecessary questions.
7. Ask one important follow-up question at a time when clarification is needed.
8. Challenge weak assumptions respectfully.
9. Explain complex creative decisions in understandable language.
10. Minimize unnecessary manual work for the creator.

CENTRAL INTELLIGENCE

You coordinate all NYX studios through shared context.

You must understand when a project needs:
- One studio.
- Several collaborating studios.
- A complete multi-stage creative workflow.
- Research before production.
- Review and creator approval before proceeding.

Do not send every request to every studio.
Select studios according to the actual task.

STUDIO SELECTION

The creator can choose:
- Automatic mode: recommend the studios needed.
- Manual mode: respect the creator's selected studios.
- Combined mode: combine creator selections with useful recommendations.

Never silently override the creator's choices.

RESEARCH AND DISCOVERY

Research is integrated into every studio.

Before making important creative decisions, consider relevant:
- References.
- Facts.
- Trends.
- Genres.
- Styles.
- Audiences.
- Assets.
- Market information.
- Creative direction.

Never invent sources, statistics or verified findings.

If live research is unavailable, say so honestly and provide
a useful research plan instead.

CREATIVE STUDIO KNOWLEDGE

FILM AND VIDEO:
Understand scripts, scenes, shot planning, visual direction,
editing plans, production workflows and video storytelling.

MUSIC:
Understand songwriting, composition, arrangements, genres,
sound direction, recording and music production workflows.

BOOKS AND WRITING:
Support brainstorming, outlining, writing, editing, revision,
formatting and publication preparation.

STORYTELLING AND VOICE:
Support narration, character dialogue, voice direction,
emotional delivery, accents, pacing and voice consistency.

GAME CREATION:
Support game concepts, mechanics, characters, world building,
level design, narrative and development planning.

MARKETING:
Support brand strategy, campaigns, content planning,
audience research, positioning and promotional material.

CHARACTER STUDIO:
Support character design, identity, personality, backstory,
visual consistency and character development.

AUDIO PRODUCTION:
Support sound design, sound effects, mixing concepts,
audio planning and production workflows.

ANIMATION:
Support visual styles, storyboards, motion concepts,
character animation and animation production planning.

COMEDY AND ENTERTAINMENT:
Support comedy writing, humour, sketches, entertainment concepts,
timing and audience engagement.

AUDIOBOOK PRODUCTION:
Support book preparation, chapter planning, narration,
voice direction, audio quality, editing and export planning.

RESEARCH AND DISCOVERY:
Support research across all studios rather than operating
as an isolated research department.

BOOK LIFECYCLE

Support the complete book journey:
idea, research, outlining, writing, editing, formatting,
publication preparation, audiobook production and export planning.

VOICE AND RIGHTS

Character voices must be distinguishable.
Consider tone, pitch, accent, age impression, pacing and emotion.

Uploaded or recorded voice samples must only be used with
appropriate permission and voice rights.

Do not imitate a real person's voice without authorization.

CREATOR CONTROL

The creator remains in control of:
- Studio selection.
- Creative direction.
- Important project decisions.
- Approval gates.
- Final deliverables.

Never claim that a creator approved something when they did not.

EXECUTION HONESTY

Distinguish between:
- Planning an action.
- Preparing an output.
- Actually executing an action.
- Successfully exporting or publishing an output.

Do not claim to have generated a finished film, song, audiobook,
animation, game or published project unless the relevant
production service actually performed that operation.

If a capability is not connected, explain what can be prepared
and what still requires an external production service.

MEMORY AND PRIVACY

Use only memory supplied in the authenticated request context.

Respect the creator's memory settings.
Never invent saved memories.
Never expose another user's information.
Never claim a memory operation succeeded without confirmation.

RESPONSE QUALITY

Give useful, specific answers rather than generic motivational text.

For creative projects, explain:
- What should happen.
- Which studios should contribute.
- Why they are needed.
- What each studio is responsible for.
- What depends on earlier work.
- Where creator approval is required.

Be honest about uncertainty and technical limitations.
`.trim();
}

/* -------------------------
   7. BUILD THE COMPLETE AI CONTEXT
------------------------- */

function buildNYXContextPrompt(
  context: RequestContext,
  orchestration: Orchestration,
  memory: MemoryContext,
  research: ResearchResult
): string {
  const researchInstructions =
    buildResearchInstructions(
      context.message,
      context.studio
    );

  return [
    buildNYXSystemPrompt(),

    "--------------------------------",
    "CURRENT CREATOR REQUEST",
    "--------------------------------",
    context.message,

    "--------------------------------",
    "MAIN STUDIO",
    "--------------------------------",
    `${context.studio.name} (${context.studio.id})`,

    "--------------------------------",
    "STUDIO ORCHESTRATION",
    "--------------------------------",
    formatOrchestrationContext(orchestration),

    "--------------------------------",
    "RESEARCH INSTRUCTIONS",
    "--------------------------------",
    researchInstructions,

    "--------------------------------",
    "RESEARCH AVAILABILITY",
    "--------------------------------",
    formatResearchContext(research),

    "--------------------------------",
    "CREATOR MEMORY",
    "--------------------------------",
    memory.contextText,

    "--------------------------------",
    "MEMORY PRIVACY",
    "--------------------------------",
    buildMemoryPrivacyInstructions(
      memory.settings
    )
  ].join("\n\n");
}

/* -------------------------
   8. CONVERSATION HISTORY
------------------------- */

function buildNYXConversationMessages(
  context: RequestContext,
  orchestration: Orchestration,
  memory: MemoryContext,
  research: ResearchResult
): NYXProviderMessage[] {
  const systemContext = buildNYXContextPrompt(
    context,
    orchestration,
    memory,
    research
  );

  const history: NYXProviderMessage[] =
    context.history.map((message) => ({
      role: message.role,
      content: message.content
    }));

  return [
    {
      role: "system",
      content: systemContext
    },
    ...history,
    {
      role: "user",
      content: context.message
    }
  ];
}

/* =========================================================
   PART 5 — NYX CORE INTELLIGENCE ENGINE
   SECTION 2 OF 2
========================================================= */

/* -------------------------
   9. STRUCTURED OUTPUT SHAPE
------------------------- */

type NYXStructuredOutput = {
  response: string;
  summary: string;
  deliverables: unknown[];
  sources: unknown[];
  followUpQuestion: string | null;
  productionStatus:
    | "planning"
    | "preparing"
    | "ready"
    | "requires_service";
  memoryUpdate: unknown | null;
};

function createEmptyStructuredOutput(
  response: string
): NYXStructuredOutput {
  return {
    response,
    summary: response,
    deliverables: [],
    sources: [],
    followUpQuestion: null,
    productionStatus: "planning",
    memoryUpdate: null
  };
}

/* -------------------------
   10. EXTRACT JSON FROM AI
------------------------- */

function extractJSONContent(
  content: string
): string | null {
  const cleaned = content.trim();

  if (!cleaned) return null;

  const withoutFence = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    JSON.parse(withoutFence);
    return withoutFence;
  } catch {
    // Try extracting the first complete JSON object.
  }

  const start = withoutFence.indexOf("{");

  if (start === -1) return null;

  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (
    let index = start;
    index < withoutFence.length;
    index++
  ) {
    const character = withoutFence[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (
      character === "\\" &&
      insideString
    ) {
      escaped = true;
      continue;
    }

    if (character === '"') {
      insideString = !insideString;
      continue;
    }

    if (insideString) continue;

    if (character === "{") depth++;

    if (character === "}") depth--;

    if (depth === 0) {
      return withoutFence.slice(start, index + 1);
    }
  }

  return null;
}

/* -------------------------
   11. SAFE FIELD HELPERS
------------------------- */

function getSafeArray(
  value: unknown,
  maximum: number
): unknown[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, maximum);
}

function getSafeText(
  value: unknown,
  fallback = "",
  maximum = 5000
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return safeString(value, maximum);
}

function getProductionStatus(
  value: unknown
): NYXStructuredOutput["productionStatus"] {
  const allowed = [
    "planning",
    "preparing",
    "ready",
    "requires_service"
  ];

  if (
    typeof value === "string" &&
    allowed.includes(value)
  ) {
    return value as NYXStructuredOutput["productionStatus"];
  }

  return "planning";
}

/* -------------------------
   12. VALIDATE AI OUTPUT
------------------------- */

function validateNYXStructuredOutput(
  value: unknown,
  fallbackResponse: string
): NYXStructuredOutput {
  if (!isPlainObject(value)) {
    return createEmptyStructuredOutput(
      fallbackResponse
    );
  }

  const response = getSafeText(
    value.response,
    fallbackResponse,
    12000
  );

  const summary = getSafeText(
    value.summary,
    response,
    3000
  );

  const followUpQuestion =
    typeof value.followUpQuestion === "string" &&
    value.followUpQuestion.trim().length > 0
      ? safeString(value.followUpQuestion, 1000)
      : null;

  return {
    response,
    summary,
    deliverables: getSafeArray(
      value.deliverables,
      MAX_DELIVERABLES
    ),
    sources: getSafeArray(
      value.sources,
      MAX_SOURCES
    ),
    followUpQuestion,
    productionStatus: getProductionStatus(
      value.productionStatus
    ),
    memoryUpdate:
      isPlainObject(value.memoryUpdate)
        ? value.memoryUpdate
        : null
  };
}

/* -------------------------
   13. PARSE AI RESPONSE
------------------------- */

function parseNYXOutput(
  content: string
): NYXStructuredOutput {
  const extracted = extractJSONContent(content);

  if (!extracted) {
    return createEmptyStructuredOutput(
      content.trim() ||
      "I couldn't prepare a response. Please try again."
    );
  }

  try {
    const parsed = JSON.parse(extracted);

    return validateNYXStructuredOutput(
      parsed,
      content
    );
  } catch {
    return createEmptyStructuredOutput(
      content.trim() ||
      "I couldn't understand the AI response. Please try again."
    );
  }
}

/* -------------------------
   14. STRUCTURED OUTPUT INSTRUCTIONS
------------------------- */

function buildStructuredOutputInstructions(
  intent: ExplicitMemoryIntent
): string {
  return [
    "FINAL RESPONSE FORMAT",
    "Return exactly one valid JSON object.",
    "Do not wrap it in Markdown code fences.",
    "",
    "Required JSON structure:",
    "{",
    '  "response": "Your complete natural response to the creator",',
    '  "summary": "A short summary",',
    '  "deliverables": [],',
    '  "sources": [],',
    '  "followUpQuestion": null,',
    '  "productionStatus": "planning",',
    '  "memoryUpdate": null',
    "}",
    "",
    "DELIVERABLE RULES",
    "- Each deliverable should describe a real proposed or prepared output.",
    "- Never claim an output has been generated when it has only been planned.",
    "- Include the responsible studio when relevant.",
    "- Include dependencies when one output relies on another.",
    "- Use draft, ready or needs_review as appropriate when describing deliverables.",
    "",
    "SOURCE RULES",
    "- Only include sources actually supplied by a connected research service.",
    "- Never invent URLs or citations.",
    "",
    "FOLLOW-UP RULES",
    "- Ask at most one important question.",
    "- Use null if no question is necessary.",
    "",
    "PRODUCTION STATUS",
    "- planning: the work is being planned.",
    "- preparing: content or instructions are being prepared.",
    "- ready: a prepared output is ready for creator review.",
    "- requires_service: an external production service is needed.",
    "",
    "MEMORY RULES",
    `Explicit creator intent: ${intent}`,
    "- Use null unless a matching explicit memory request exists.",
    "- Never invent a memory record ID.",
    "- For save or update, provide action, content and category.",
    "- For delete, provide action and an existing memory ID only if supplied.",
    "- Never claim a memory operation has succeeded.",
    "",
    "Return valid JSON only."
  ].join("\n");
}

/* -------------------------
   15. NORMALIZE DELIVERABLES
------------------------- */

function normalizeNYXDeliverables(
  values: unknown[]
): Deliverable[] {
  const output: Deliverable[] = [];

  for (const value of values.slice(
    0,
    MAX_DELIVERABLES
  )) {
    if (!isPlainObject(value)) continue;

    const title = getSafeText(
      value.title,
      "",
      200
    );

    const description = getSafeText(
      value.description,
      "",
      2000
    );

    if (!title || !description) continue;

    const status =
      typeof value.status === "string" &&
      VALID_DELIVERABLE_STATUSES.has(
        value.status as Deliverable["status"]
      )
        ? value.status
        : "draft";

    output.push({
      title,
      description,
      status
    } as Deliverable);
  }

  return output;
}

/* -------------------------
   16. NORMALIZE RESEARCH SOURCES
------------------------- */

function normalizeNYXSources(
  values: unknown[]
): ResearchSource[] {
  const output: ResearchSource[] = [];

  for (const value of values.slice(
    0,
    MAX_SOURCES
  )) {
    if (!isPlainObject(value)) continue;

    const title = getSafeText(
      value.title,
      "",
      300
    );

    const url = getSafeText(
      value.url,
      "",
      2000
    );

    const description = getSafeText(
      value.description,
      "",
      1000
    );

    if (!title || !url) continue;

    try {
      const parsedURL = new URL(url);

      if (
        parsedURL.protocol !== "https:" &&
        parsedURL.protocol !== "http:"
      ) {
        continue;
      }
    } catch {
      continue;
    }

    output.push({
      title,
      url,
      description,
      verified: false
    } as ResearchSource);
  }

  return output;
}

/* -------------------------
   17. PREPARE THE MEMORY ACTION
------------------------- */

function prepareAuthorizedNYXMemoryAction(
  parsed: NYXStructuredOutput,
  intent: ExplicitMemoryIntent,
  settings: MemorySettings
): MemoryUpdate | null {
  if (
    intent === "none" ||
    parsed.memoryUpdate === null
  ) {
    return null;
  }

  return prepareMemoryUpdate(
    parsed.memoryUpdate,
    intent,
    settings
  );
}

/* -------------------------
   18. RUN THE COMPLETE AI RESPONSE
------------------------- */

async function generateNYXStructuredResponse(
  context: RequestContext,
  orchestration: Orchestration,
  memory: MemoryContext,
  research: ResearchResult
): Promise<{
  parsed: NYXStructuredOutput;
  provider: AIProvider;
  model: string;
}> {
  const intent = detectExplicitMemoryIntent(
    context.message
  );

  const messages =
    buildNYXConversationMessages(
      context,
      orchestration,
      memory,
      research
    );

  messages[0].content +=
    "\n\n" +
    buildMemoryActionInstructions(intent) +
    "\n\n" +
    buildStructuredOutputInstructions(intent);

  const result = await runNYXIntelligence(
    messages
  );

  const parsed = parseNYXOutput(
    result.content
  );

  return {
    parsed,
    provider: result.provider,
    model: result.model
  };
}

/* -------------------------
   19. BUILD FINAL NYX RESPONSE
------------------------- */

function buildNYXResponseData(
  context: RequestContext,
  orchestration: Orchestration,
  parsed: NYXStructuredOutput,
  research: ResearchResult,
  memoryResult: {
    success: boolean;
    action: ExplicitMemoryIntent;
    message: string;
  },
  provider: AIProvider,
  model: string
): NYXResponse {
  const responseText = [
    parsed.response,
    parsed.followUpQuestion
      ? "\n\n" + parsed.followUpQuestion
      : ""
  ].join("");

  const responseData = {
    response: responseText,
    summary: parsed.summary,
    studio: context.studio,
    orchestration,
    deliverables: normalizeNYXDeliverables(
      parsed.deliverables
    ),
    sources: normalizeNYXSources(
      parsed.sources
    ),
    research,
    memory: memoryResult,
    productionStatus: parsed.productionStatus,
    provider,
    model
  };

  return responseData as unknown as NYXResponse;
}
