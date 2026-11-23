
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ======================================================
// NYX CORE — CONFIGURATION
// ======================================================

const GROQ_MODEL = "openai/gpt-oss-120b";
const BACKUP_MODEL = "openrouter/free";

const MAX_MESSAGE_LENGTH = 12000;
const MAX_STUDIO_CONTEXT = 6000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_ITEM_LENGTH = 4000;
const MAX_MEMORY_ITEMS = 30;
const MAX_MEMORY_UPDATES = 8;
const MAX_DELIVERABLES = 20;

const ALLOWED_MEMORY_TYPES = [
  "project",
  "character",
  "world",
  "plot",
  "style",
  "preference",
  "research",
  "continuity",
  "manual",
] as const;

type MemoryType = typeof ALLOWED_MEMORY_TYPES[number];

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ======================================================
// ALL 12 NYX STUDIOS
// ======================================================

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
    role: "Film and visual storytelling",
    responsibilities: [
      "Film concepts and original scripts",
      "Scenes, storyboards and shot planning",
      "Cinematography and visual direction",
      "Production planning",
      "Film research and visual references",
    ],
    keywords:
      /\b(film|movie|cinema|scene|screenplay|shot|camera|director|filmmaking)\b/i,
    dependencies: [
      "characters",
      "books",
      "voice",
      "research",
      "music",
      "audio",
    ],
  },
  {
    id: "music",
    name: "Music Studio",
    role: "Original music creation",
    responsibilities: [
      "Original songs and lyrics",
      "Melodies and arrangements",
      "Genres and musical direction",
      "African and global music styles",
      "Music production planning",
    ],
    keywords:
      /\b(music|song|beat|melody|lyrics|instrumental|gengetone|urbantone|mugithi|afrobeats)\b/i,
    dependencies: ["voice", "audio", "research"],
  },
  {
    id: "books",
    name: "Book Studio",
    role: "Book writing, editing and publishing",
    responsibilities: [
      "Book concepts and outlines",
      "Chapter writing and editing",
      "Character and plot continuity",
      "Book formatting and preparation",
      "Publishing and export preparation",
    ],
    keywords:
      /\b(book|novel|chapter|story|fiction|nonfiction|author|manuscript|publish|writing)\b/i,
    dependencies: [
      "characters",
      "research",
      "voice",
      "audiobooks",
    ],
  },
  {
    id: "voice",
    name: "Voice Studio",
    role: "Voice creation and production",
    responsibilities: [
      "Voice direction and profiles",
      "Distinct character dialogue voices",
      "Narration and voice-over",
      "Voice recording workflows",
      "Consent and voice-rights safeguards",
    ],
    keywords:
      /\b(voice|voiceover|voice-over|narration|accent|dialogue|speaking|recording)\b/i,
    dependencies: ["audio", "characters", "research"],
  },
  {
    id: "games",
    name: "Games Studio",
    role: "Game design and development",
    responsibilities: [
      "Game concepts and mechanics",
      "Playable game planning",
      "Characters and environments",
      "Game stories and levels",
      "Testing and export preparation",
    ],
    keywords:
      /\b(game|gaming|playable|level|gameplay|quest|player|multiplayer|video game)\b/i,
    dependencies: [
      "characters",
      "animation",
      "audio",
      "music",
      "research",
    ],
  },
  {
    id: "marketing",
    name: "Marketing Studio",
    role: "Marketing and promotion",
    responsibilities: [
      "Brand strategy",
      "Campaign planning",
      "Audience research",
      "Promotional content",
      "Marketing performance ideas",
    ],
    keywords:
      /\b(marketing|advert|advertising|campaign|brand|promotion|audience|social media|launch)\b/i,
    dependencies: [
      "film",
      "music",
      "research",
      "characters",
    ],
  },
  {
    id: "characters",
    name: "Character Studio",
    role: "Character creation and development",
    responsibilities: [
      "Character personalities",
      "Character histories and relationships",
      "Appearance and visual references",
      "Character dialogue",
      "Character continuity",
    ],
    keywords:
      /\b(character|personality|protagonist|antagonist|villain|hero|backstory|cast|persona)\b/i,
    dependencies: [
      "books",
      "film",
      "voice",
      "animation",
      "research",
    ],
  },
  {
    id: "audio",
    name: "Audio Studio",
    role: "Sound and audio production",
    responsibilities: [
      "Sound effects",
      "Audio editing plans",
      "Sound design",
      "Atmosphere and ambience",
      "Audio production workflows",
    ],
    keywords:
      /\b(audio|sound|sound effect|sfx|ambience|soundscape|mixing|mastering)\b/i,
    dependencies: [
      "music",
      "voice",
      "film",
      "animation",
    ],
  },
  {
    id: "animation",
    name: "Animation Studio",
    role: "Animation and motion creation",
    responsibilities: [
      "Animation concepts",
      "Character movement",
      "Storyboards",
      "Motion and scene planning",
      "Animation production workflows",
    ],
    keywords:
      /\b(animation|animate|animated|cartoon|motion|3d|2d|frame|storyboard)\b/i,
    dependencies: [
      "characters",
      "film",
      "audio",
      "music",
      "research",
    ],
  },
  {
    id: "comedy",
    name: "Comedy Studio",
    role: "Comedy and humorous storytelling",
    responsibilities: [
      "Comedy writing",
      "Sketches and short scenes",
      "Jokes and comedic dialogue",
      "Characters and comedic timing",
      "Comedy research and references",
    ],
    keywords:
      /\b(comedy|funny|joke|humour|humor|sketch|satire|parody|stand.?up)\b/i,
    dependencies: [
      "characters",
      "film",
      "books",
      "voice",
    ],
  },
  {
    id: "audiobooks",
    name: "Audiobook Studio",
    role: "Audiobook creation and production",
    responsibilities: [
      "Chapter-by-chapter narration",
      "Distinct character dialogue voices",
      "Narrator selection and direction",
      "Audio quality planning",
      "Audiobook export preparation",
    ],
    keywords:
      /\b(audiobook|audio book|chapter narration|book narration|narrate my book)\b/i,
    dependencies: [
      "books",
      "voice",
      "audio",
      "characters",
    ],
  },
  {
    id: "research",
    name: "Research Studio",
    role: "Research and discovery",
    responsibilities: [
      "Fact-finding and verification",
      "Creative references",
      "Trends and audience discovery",
      "Genre and style research",
      "Research support for every studio",
    ],
    keywords:
      /\b(research|investigate|verify|sources|references|facts|trends|discover|latest information)\b/i,
    dependencies: [],
  },
];

// ======================================================
// SHARED DATA TYPES
// ======================================================

type MemoryApprovalStatus =
  | "creator-stated"
  | "creator-confirmed"
  | "assistant-proposed"
  | "draft";

type MemoryUpdate = {
  type: MemoryType;
  title: string;
  content: Record<string, unknown>;
  approvalStatus: MemoryApprovalStatus;
  evidence?: string;
};

type DeliverableStatus =
  | "ready"
  | "planned"
  | "requires_engine";

type Deliverable = {
  studioId: string;
  type: string;
  title: string;
  description: string;
  status: DeliverableStatus;
};

type MemoryAction =
  | "list"
  | "create"
  | "update"
  | "delete"
  | "delete_all";

type MemoryActionRequest = {
  action: MemoryAction;
  memoryId?: string;
  projectId?: string | null;
  studio?: string;
  memoryType?: MemoryType;
  title?: string;
  content?: Record<string, unknown>;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AIResult = {
  content: string;
  provider: string;
  model: string;
};

type Orchestration = {
  leadStudio: string;
  supportingStudios: string[];
  responsibilities: Record<string, string[]>;
};

type ParsedNYXOutput = {
  response: string;
  deliverables: Deliverable[];
  memoryUpdates: MemoryUpdate[];
};

// ======================================================
// BASIC RESPONSE HELPERS
// ======================================================

function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ======================================================
// SAFE TEXT AND CONTENT
// ======================================================

function safeText(
  value: unknown,
  maxLength = 2000,
): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function safeContent(
  value: unknown,
): Record<string, unknown> {
  if (!isPlainObject(value)) return {};

  try {
    const serialized = JSON.stringify(value);

    if (
      !serialized ||
      serialized.length > 12000
    ) {
      return {};
    }

    const parsed: unknown = JSON.parse(serialized);

    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// ======================================================
// STUDIO LOOKUP
// ======================================================

function getStudio(
  studioId: unknown,
): Studio | null {
  if (typeof studioId !== "string") return null;

  return STUDIOS.find(
    (studio) => studio.id === studioId,
  ) ?? null;
}

function getStudioByName(
  name: unknown,
): Studio | null {
  if (typeof name !== "string") return null;

  const normalized = name.trim().toLowerCase();

  return STUDIOS.find(
    (studio) =>
      studio.id === normalized ||
      studio.name.toLowerCase() === normalized,
  ) ?? null;
}

// ======================================================
// MESSAGE VALIDATION
// ======================================================

function validateMessage(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new Error("Please enter a valid message.");
  }

  const message = value.trim();

  if (!message) {
    throw new Error("Please enter a message for NYX.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Your message exceeds the ${MAX_MESSAGE_LENGTH} character limit.`,
    );
  }

  return message;
}

// ======================================================
// PROJECT ID VALIDATION
// ======================================================

function validateProjectId(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Invalid project identifier.");
  }

  const projectId = value.trim();

  if (
    projectId.length === 0 ||
    projectId.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(projectId)
  ) {
    throw new Error("Invalid project identifier.");
  }

  return projectId;
}

// ======================================================
// MEMORY TYPE VALIDATION
// ======================================================

function validateMemoryType(
  value: unknown,
): MemoryType {
  if (
    typeof value !== "string" ||
    !ALLOWED_MEMORY_TYPES.includes(value as MemoryType)
  ) {
    throw new Error("Invalid memory type.");
  }

  return value as MemoryType;
}

// ======================================================
// CONVERSATION HISTORY VALIDATION
// ======================================================

function buildLimitedHistory(
  value: unknown,
): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  const history: ChatMessage[] = [];

  for (const item of value.slice(-MAX_HISTORY_MESSAGES)) {
    if (!isPlainObject(item)) continue;

    if (
      item.role !== "user" &&
      item.role !== "assistant"
    ) {
      continue;
    }

    const content = safeText(
      item.content,
      MAX_HISTORY_ITEM_LENGTH,
    );

    if (!content) continue;

    history.push({
      role: item.role,
      content,
    });
  }

  return history;
}

// ======================================================
// MEMORY DATABASE TYPES
// ======================================================

type MemoryRecord = {
  id: string;
  user_id: string;
  project_id: string | null;
  studio: string | null;
  memory_type: string;
  title: string;
  content: Record<string, unknown>;
  source_url?: string | null;
  source_title?: string | null;
  published_at?: string | null;
  researched_at?: string | null;
  created_at: string;
  updated_at: string;
};

type MemorySettings = {
  user_id: string;
  auto_save_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

// ======================================================
// MEMORY SETTINGS
// ======================================================

async function getMemorySettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemorySettings> {
  const { data, error } = await supabase
    .from("nyx_memory_settings")
    .select("user_id, auto_save_enabled, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("NYX could not load your memory settings.");
  }

  if (data) {
    return data as MemorySettings;
  }

  const { data: created, error: insertError } = await supabase
    .from("nyx_memory_settings")
    .insert({
      user_id: userId,
      auto_save_enabled: true,
    })
    .select("user_id, auto_save_enabled, created_at, updated_at")
    .single();

  if (!insertError && created) {
    return created as MemorySettings;
  }

  // Another request may have created the settings row at the same time.
  const { data: existing, error: retryError } = await supabase
    .from("nyx_memory_settings")
    .select("user_id, auto_save_enabled, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!retryError && existing) {
    return existing as MemorySettings;
  }

  throw new Error("NYX could not initialize your memory settings.");
}

async function updateMemorySettings(
  supabase: SupabaseClient,
  userId: string,
  autoSaveEnabled: boolean,
): Promise<MemorySettings> {
  const { data, error } = await supabase
    .from("nyx_memory_settings")
    .upsert(
      {
        user_id: userId,
        auto_save_enabled: autoSaveEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, auto_save_enabled, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error("NYX could not update your memory settings.");
  }

  return data as MemorySettings;
}

// ======================================================
// MEMORY CONTEXT FOR NYX
// ======================================================

function buildMemoryContext(
  memories: MemoryRecord[],
): string {
  if (!memories.length) {
    return "No saved creator memories are available for this context.";
  }

  const sections = memories.map((memory, index) => {
    const content = safeContent(memory.content);

    return [
      `Memory ${index + 1}`,
      `Type: ${safeText(memory.memory_type, 50)}`,
      `Title: ${safeText(memory.title, 200)}`,
      `Studio: ${safeText(memory.studio || "general", 100)}`,
      `Details: ${JSON.stringify(content).slice(0, 1800)}`,
    ].join("\n");
  });

  return sections.join("\n\n").slice(0, 16000);
}

// ======================================================
// LIST CREATOR MEMORIES
// ======================================================

async function listCreatorMemories(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | null = null,
): Promise<MemoryRecord[]> {
  let query = supabase
    .from("nyx_shared_memory")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_MEMORY_ITEMS);

  // Without a project filter, return the creator's saved memories.
  // With a project filter, return that project's memories and
  // creator-wide memories.
  if (projectId !== null) {
    const [projectResult, globalResult] = await Promise.all([
      supabase
        .from("nyx_shared_memory")
        .select("*")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(MAX_MEMORY_ITEMS),

      supabase
        .from("nyx_shared_memory")
        .select("*")
        .eq("user_id", userId)
        .is("project_id", null)
        .order("updated_at", { ascending: false })
        .limit(MAX_MEMORY_ITEMS),
    ]);

    if (projectResult.error || globalResult.error) {
      throw new Error("NYX could not load your saved memories.");
    }

    const combined = [
      ...((projectResult.data ?? []) as MemoryRecord[]),
      ...((globalResult.data ?? []) as MemoryRecord[]),
    ];

    const unique = new Map<string, MemoryRecord>();

    for (const memory of combined) {
      unique.set(memory.id, memory);
    }

    return Array.from(unique.values())
      .sort((a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime()
      )
      .slice(0, MAX_MEMORY_ITEMS);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("NYX could not load your saved memories.");
  }

  return (data ?? []) as MemoryRecord[];
}

// ======================================================
// RETRIEVE MEMORIES FOR A PROJECT AND STUDIO
// ======================================================

async function retrieveProjectMemories(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | null,
  studioId: string,
): Promise<MemoryRecord[]> {
  const memories = await listCreatorMemories(
    supabase,
    userId,
    projectId,
  );

  const relevant = memories.filter((memory) => {
    const memoryStudio = memory.studio || "general";

    return (
      memoryStudio === "general" ||
      memoryStudio === studioId
    );
  });

  return relevant.slice(0, MAX_MEMORY_ITEMS);
}

// ======================================================
// CREATE A CREATOR MEMORY
// ======================================================

async function createCreatorMemory(
  supabase: SupabaseClient,
  userId: string,
  input: {
    projectId?: string | null;
    studio?: string;
    memoryType: MemoryType;
    title: string;
    content: Record<string, unknown>;
  },
): Promise<MemoryRecord> {
  const projectId = validateProjectId(
    input.projectId ?? null,
  );

  const title = safeText(input.title, 200);
  const content = safeContent(input.content);

  if (!title) {
    throw new Error("A memory title is required.");
  }

  if (!Object.keys(content).length) {
    throw new Error("Please provide valid memory details.");
  }

  const studio = input.studio
    ? safeText(input.studio, 100)
    : "general";

  if (
    studio !== "general" &&
    !getStudio(studio)
  ) {
    throw new Error("Invalid studio for this memory.");
  }

  const { data, error } = await supabase
    .from("nyx_shared_memory")
    .insert({
      user_id: userId,
      project_id: projectId,
      studio,
      memory_type: input.memoryType,
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("NYX could not save this memory.");
  }

  return data as MemoryRecord;
}

// ======================================================
// UPDATE A CREATOR MEMORY
// ======================================================

async function updateCreatorMemory(
  supabase: SupabaseClient,
  userId: string,
  memoryId: string,
  updates: {
    projectId?: string | null;
    studio?: string;
    memoryType?: MemoryType;
    title?: string;
    content?: Record<string, unknown>;
  },
): Promise<MemoryRecord> {
  const safeId = safeText(memoryId, 128);

  if (!safeId) {
    throw new Error("A valid memory identifier is required.");
  }

  const changes: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.projectId !== undefined) {
    changes.project_id = validateProjectId(updates.projectId);
  }

  if (updates.studio !== undefined) {
    const studio = safeText(updates.studio, 100);

    if (studio !== "general" && !getStudio(studio)) {
      throw new Error("Invalid studio for this memory.");
    }

    changes.studio = studio;
  }

  if (updates.memoryType !== undefined) {
    changes.memory_type = validateMemoryType(updates.memoryType);
  }

  if (updates.title !== undefined) {
    const title = safeText(updates.title, 200);

    if (!title) {
      throw new Error("A memory title cannot be empty.");
    }

    changes.title = title;
  }

  if (updates.content !== undefined) {
    const content = safeContent(updates.content);

    if (!Object.keys(content).length) {
      throw new Error("Please provide valid memory details.");
    }

    changes.content = content;
  }

  const { data, error } = await supabase
    .from("nyx_shared_memory")
    .update(changes)
    .eq("id", safeId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("NYX could not update this memory.");
  }

  if (!data) {
    throw new Error("Memory not found or you do not have permission to edit it.");
  }

  return data as MemoryRecord;
}

// ======================================================
// DELETE ONE CREATOR MEMORY
// ======================================================

async function deleteCreatorMemory(
  supabase: SupabaseClient,
  userId: string,
  memoryId: string,
): Promise<boolean> {
  const safeId = safeText(memoryId, 128);

  if (!safeId) {
    throw new Error("A valid memory identifier is required.");
  }

  const { data, error } = await supabase
    .from("nyx_shared_memory")
    .delete()
    .eq("id", safeId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("NYX could not delete this memory.");
  }

  if (!data) {
    throw new Error("Memory not found or you do not have permission to delete it.");
  }

  return true;
}

// ======================================================
// DELETE ALL MEMORIES BELONGING TO ONE CREATOR
// ======================================================

async function deleteAllCreatorMemories(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("nyx_shared_memory")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw new Error("NYX could not delete your memories.");
  }

  return Array.isArray(data) ? data.length : 0;
}

// ======================================================
// MEMORY ACTION HANDLER
// ======================================================

async function handleMemoryAction(
  supabase: SupabaseClient,
  userId: string,
  request: MemoryActionRequest,
): Promise<Record<string, unknown>> {
  const projectId = validateProjectId(
    request.projectId ?? null,
  );

  switch (request.action) {
    case "list": {
      const memories = await listCreatorMemories(
        supabase,
        userId,
        projectId,
      );

      return {
        success: true,
        memories,
        count: memories.length,
      };
    }

    case "create": {
      if (!request.memoryType) {
        throw new Error("Please select a memory type.");
      }

      const memory = await createCreatorMemory(
        supabase,
        userId,
        {
          projectId,
          studio: request.studio,
          memoryType: validateMemoryType(request.memoryType),
          title: safeText(request.title, 200),
          content: safeContent(request.content),
        },
      );

      return {
        success: true,
        memory,
      };
    }

    case "update": {
      if (!request.memoryId) {
        throw new Error("A memory identifier is required.");
      }

      const memory = await updateCreatorMemory(
        supabase,
        userId,
        request.memoryId,
        {
          projectId: request.projectId,
          studio: request.studio,
          memoryType: request.memoryType
            ? validateMemoryType(request.memoryType)
            : undefined,
          title: request.title,
          content: request.content,
        },
      );

      return {
        success: true,
        memory,
      };
    }

    case "delete": {
      if (!request.memoryId) {
        throw new Error("A memory identifier is required.");
      }

      await deleteCreatorMemory(
        supabase,
        userId,
        request.memoryId,
      );

      return {
        success: true,
        deleted: true,
      };
    }

    case "delete_all": {
      const deletedCount = await deleteAllCreatorMemories(
        supabase,
        userId,
      );

      return {
        success: true,
        deleted: true,
        deletedCount,
      };
    }

    default:
      throw new Error("Unsupported memory action.");
  }
}

// ======================================================
// MEMORY TITLE NORMALIZATION
// ======================================================

function normalizeMemoryTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ======================================================
// NORMALIZE AI MEMORY SUGGESTIONS
// ======================================================

function normalizeMemoryUpdates(
  value: unknown,
): MemoryUpdate[] {
  if (!Array.isArray(value)) return [];

  const updates: MemoryUpdate[] = [];

  for (const item of value.slice(0, MAX_MEMORY_UPDATES)) {
    if (!isPlainObject(item)) continue;

    let type: MemoryType;

    try {
      type = validateMemoryType(item.type);
    } catch {
      continue;
    }

    const title = safeText(item.title, 200);
    const content = safeContent(item.content);

    if (!title || !Object.keys(content).length) {
      continue;
    }

    const allowedStatuses: MemoryApprovalStatus[] = [
      "creator-stated",
      "creator-confirmed",
      "assistant-proposed",
      "draft",
    ];

    const approvalStatus = allowedStatuses.includes(
      item.approvalStatus as MemoryApprovalStatus,
    )
      ? item.approvalStatus as MemoryApprovalStatus
      : "draft";

    updates.push({
      type,
      title,
      content,
      approvalStatus,
      evidence: safeText(item.evidence, 1000),
    });
  }

  return updates;
}

// ======================================================
// VERIFY MEMORY AGAINST CREATOR-PROVIDED TEXT
// ======================================================

function buildCreatorEvidenceText(
  message: string,
  history: ChatMessage[],
  studioContext: string,
): string {
  const creatorText = [
    message,
    ...history
      .filter((item) => item.role === "user")
      .map((item) => item.content),
    studioContext,
  ];

  return creatorText.join("\n").toLowerCase();
}

function hasCreatorEvidence(
  update: MemoryUpdate,
  evidenceText: string,
): boolean {
  if (
    update.approvalStatus !== "creator-stated" &&
    update.approvalStatus !== "creator-confirmed"
  ) {
    return false;
  }

  const evidence = safeText(update.evidence, 1000)
    .toLowerCase()
    .trim();

  if (evidence.length < 12) {
    return false;
  }

  return evidenceText.includes(evidence);
}

// ======================================================
// AUTOMATIC MEMORY SAVING
// ======================================================

async function saveAutomaticMemories(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | null,
  studioId: string,
  updates: MemoryUpdate[],
  evidenceText: string,
): Promise<number> {
  let savedCount = 0;

  const verifiedUpdates = updates.filter((update) =>
    hasCreatorEvidence(update, evidenceText)
  );

  for (const update of verifiedUpdates) {
    const title = safeText(update.title, 200);
    const normalizedTitle = normalizeMemoryTitle(title);

    if (!normalizedTitle) continue;

    let existingQuery = supabase
      .from("nyx_shared_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("studio", studioId)
      .eq("memory_type", update.type);

    if (projectId === null) {
      existingQuery = existingQuery.is("project_id", null);
    } else {
      existingQuery = existingQuery.eq("project_id", projectId);
    }

    const { data: existingRows, error: lookupError } =
      await existingQuery.limit(100);

    if (lookupError) {
      continue;
    }

    const existing = (
      (existingRows ?? []) as MemoryRecord[]
    ).find((memory) =>
      normalizeMemoryTitle(memory.title) === normalizedTitle
    );

    const newContent = safeContent(update.content);

    if (existing) {
      const previousContent = safeContent(existing.content);

      const previousStatus = safeText(
        previousContent.approvalStatus,
        50,
      );

      const incomingStatus = update.approvalStatus;

      const previousIsConfirmed =
        previousStatus === "creator-confirmed";

      const incomingIsConfirmed =
        incomingStatus === "creator-confirmed";

      const mergedContent = {
        ...previousContent,
        ...newContent,
        approvalStatus:
          previousIsConfirmed && !incomingIsConfirmed
            ? "creator-confirmed"
            : incomingStatus,
        evidence: update.evidence,
        lastVerifiedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("nyx_shared_memory")
        .update({
          content: mergedContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

      if (!updateError) {
        savedCount++;
      }

      continue;
    }

    const { error: insertError } = await supabase
      .from("nyx_shared_memory")
      .insert({
        user_id: userId,
        project_id: projectId,
        studio: studioId,
        memory_type: update.type,
        title,
        content: {
          ...newContent,
          approvalStatus: update.approvalStatus,
          evidence: update.evidence,
          savedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });

    if (!insertError) {
      savedCount++;
    }
  }

  return savedCount;
}

// ======================================================
// MEMORY INSTRUCTIONS FOR NYX
// ======================================================

function buildMemoryInstructions(): string {
  return `
MEMORY RULES:

1. Protect the creator's established facts and project continuity.

2. Distinguish between:
   - creator-stated: explicitly stated by the creator.
   - creator-confirmed: explicitly confirmed by the creator.
   - assistant-proposed: an idea suggested by NYX.
   - draft: information that is uncertain or incomplete.

3. Never present an assistant-proposed idea as an established fact.

4. Never silently replace established character names, ages,
   relationships, locations, timelines, events or project facts.

5. When a creator corrects an established fact, respect the
   correction and use the new information going forward.

6. Do not invent personal preferences, project details,
   research findings or creator decisions.

7. Only suggest memory updates when they are useful for future
   conversations and project continuity.

8. Each memory update must include:
   - type
   - title
   - content
   - approvalStatus
   - evidence

9. The evidence field must contain an exact, meaningful excerpt
   from creator-provided text. Never manufacture an excerpt.

10. If you cannot identify exact creator-provided evidence,
    mark the update as assistant-proposed or draft.

11. Keep separate projects separate. Never transfer a character,
    plot, setting or decision from one project to another.

12. Creator-wide preferences must only be stored when the
    creator clearly states or confirms them.

13. Do not save temporary conversation details as permanent
    memories unless they matter to future work.

14. Never claim that a memory was saved unless the system
    confirms that the database operation succeeded.
`;
}

// ======================================================
// STUDIO COLLABORATION AND ORCHESTRATION
// ======================================================

function buildOrchestration(
  leadStudio: Studio,
  message: string,
): Orchestration {
  const supporting = new Set<string>();

  for (const dependency of leadStudio.dependencies) {
    const studio = getStudio(dependency);

    if (!studio) continue;

    if (studio.keywords.test(message)) {
      supporting.add(studio.id);
    }
  }

  // Research supports every studio when relevant.
  const researchRequested =
    /\b(research|investigate|verify|sources|references|facts|trends|discover|latest information)\b/i
      .test(message);

  if (
    researchRequested &&
    leadStudio.id !== "research"
  ) {
    supporting.add("research");
  }

  supporting.delete(leadStudio.id);

  const responsibilities: Record<string, string[]> = {
    [leadStudio.id]: leadStudio.responsibilities,
  };

  for (const studioId of supporting) {
    const studio = getStudio(studioId);

    if (studio) {
      responsibilities[studioId] = studio.responsibilities;
    }
  }

  return {
    leadStudio: leadStudio.id,
    supportingStudios: Array.from(supporting),
    responsibilities,
  };
}

// ======================================================
// DELIVERABLE VALIDATION
// ======================================================

function normalizeDeliverables(
  value: unknown,
): Deliverable[] {
  if (!Array.isArray(value)) return [];

  const deliverables: Deliverable[] = [];

  for (const item of value.slice(0, MAX_DELIVERABLES)) {
    if (!isPlainObject(item)) continue;

    const studio = getStudio(item.studioId);

    if (!studio) continue;

    const type = safeText(item.type, 80);
    const title = safeText(item.title, 200);
    const description = safeText(item.description, 1200);

    if (!type || !title || !description) continue;

    const allowedStatuses: DeliverableStatus[] = [
      "ready",
      "planned",
      "requires_engine",
    ];

    const status = allowedStatuses.includes(
      item.status as DeliverableStatus,
    )
      ? item.status as DeliverableStatus
      : "planned";

    deliverables.push({
      studioId: studio.id,
      type,
      title,
      description,
      status,
    });
  }

  return deliverables;
}

// ======================================================
// RESEARCH REQUEST DETECTION
// ======================================================

function isResearchRequest(message: string): boolean {
  return /\b(research|investigate|verify|sources|references|facts|trends|discover|latest information|find current|look up)\b/i
    .test(message);
}

// ======================================================
// EXPLICIT MEMORY REQUEST DETECTION
// ======================================================

function isExplicitMemoryRequest(message: string): boolean {
  return /\b(remember|save this|store this|keep this in mind|don't forget|do not forget|make this permanent)\b/i
    .test(message);
}

// ======================================================
// SYSTEM PROMPT
// ======================================================

function createSystemPrompt(args: {
  studio: Studio;
  studioContext: string;
  memoryContext: string;
  orchestration: Orchestration;
  researchRequested: boolean;
}): string {
  const {
    studio,
    studioContext,
    memoryContext,
    orchestration,
    researchRequested,
  } = args;

  return `
You are NYX CORE, the central intelligence of the NYX creative universe.

You are not a generic chatbot. You are a creative partner that
understands projects, coordinates specialist studios and protects
the creator's original vision.

CURRENT LEAD STUDIO:
${studio.name}

STUDIO PURPOSE:
${studio.role}

STUDIO RESPONSIBILITIES:
${JSON.stringify(studio.responsibilities)}

AVAILABLE COLLABORATION:
${JSON.stringify(orchestration)}

CREATOR'S STUDIO CONTEXT:
${studioContext || "No additional studio context was provided."}

SAVED CREATOR MEMORIES:
${memoryContext}

${buildMemoryInstructions()}

CREATIVE BEHAVIOUR:

- Understand the creator's actual request before responding.
- Do not force unnecessary questions.
- Ask one useful follow-up question when essential information
  is missing.
- Preserve the creator's writing voice and creative direction.
- Give practical, usable outputs rather than vague promises.
- Be warm, natural, intelligent and emotionally aware.
- Do not pretend to have created files, videos, music, games
  or other media when no production engine has actually done so.
- Distinguish planning from completed production.
- Do not invent tools, connected services or completed actions.
- Do not claim that supporting studios performed separate
  AI executions. You are coordinating their responsibilities
  within this request.

PROJECT CONTINUITY:

- Treat saved memories as established project context.
- Preserve names, ages, relationships, settings, timelines,
  events and important creator decisions.
- If new instructions conflict with saved facts, ask for
  clarification when it is unclear whether the creator intends
  a correction or a different version.
- Never mix details from unrelated projects.

RESEARCH:

${
  researchRequested
    ? `The creator has requested research.
Do not invent sources, URLs, dates, statistics or findings.
No verified live research provider is currently connected.
Explain that live verification is unavailable and provide
clearly labelled general knowledge only when appropriate.`
    : `Do not claim that live research has been conducted.
Research and discovery can be planned when useful.`
}

PRODUCTION:

- A deliverable marked "ready" must actually be available
  as a completed output in the response.
- Use "planned" for work that has only been described.
- Use "requires_engine" when an external rendering,
  generation or production service is needed.
- Never pretend Groq itself renders video, generates audio,
  compiles games or exports finished books.

MEMORY OUTPUT:

Suggest only genuinely useful memory updates.
Every update must contain an exact evidence excerpt from
creator-provided text.
Do not invent evidence.
Use "creator-stated" only when the creator explicitly stated
the fact in the provided text.
Use "creator-confirmed" only when the creator explicitly
confirmed the fact.
Use "assistant-proposed" for your own suggestions.
Use "draft" when uncertain.

OUTPUT FORMAT:

Return one valid JSON object only.

Required structure:

{
  "response": "Your complete natural-language answer",
  "deliverables": [
    {
      "studioId": "valid studio ID",
      "type": "deliverable type",
      "title": "deliverable title",
      "description": "what it contains",
      "status": "ready, planned, or requires_engine"
    }
  ],
  "memoryUpdates": [
    {
      "type": "valid memory type",
      "title": "short memory title",
      "content": {
        "fact": "the actual creator-provided fact"
      },
      "approvalStatus": "creator-stated, creator-confirmed, assistant-proposed, or draft",
      "evidence": "exact excerpt from creator-provided text"
    }
  ]
}

Return empty arrays when there are no deliverables or memory updates.
Do not wrap the JSON in Markdown code fences.
`;
}

// ======================================================
// AI PROVIDER RESPONSE TYPES
// ======================================================

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  model?: string;
};

type ProviderRequestMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// ======================================================
// PROVIDER RESPONSE EXTRACTION
// ======================================================

function extractProviderContent(
  payload: unknown,
): string {
  if (!isPlainObject(payload)) {
    throw new Error("The AI provider returned an invalid response.");
  }

  const choices = payload.choices;

  if (!Array.isArray(choices) || !choices.length) {
    throw new Error("The AI provider returned no answer.");
  }

  const firstChoice = choices[0];

  if (!isPlainObject(firstChoice)) {
    throw new Error("The AI provider returned an invalid answer.");
  }

  const message = firstChoice.message;

  if (!isPlainObject(message)) {
    throw new Error("The AI provider returned an empty answer.");
  }

  const content = message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI provider returned an empty answer.");
  }

  return content.trim();
}

// ======================================================
// GROQ PRIMARY PROVIDER
// ======================================================

async function callGroq(
  messages: ProviderRequestMessage[],
  apiKey: string,
): Promise<AIResult> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.6,
        max_completion_tokens: 6000,
        response_format: {
          type: "json_object",
        },
        reasoning_format: "hidden",
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Groq request failed:",
      response.status,
      errorText.slice(0, 1000),
    );

    throw new Error(
      `Groq request failed with status ${response.status}.`,
    );
  }

  const payload: unknown = await response.json();

  return {
    content: extractProviderContent(payload),
    provider: "Groq",
    model: GROQ_MODEL,
  };
}

// ======================================================
// OPENROUTER BACKUP PROVIDER
// ======================================================

async function callOpenRouter(
  messages: ProviderRequestMessage[],
  apiKey: string,
): Promise<AIResult> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyx-creative--universe.pages.dev",
        "X-Title": "NYX Creative Universe",
      },
      body: JSON.stringify({
        model: BACKUP_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 6000,
        response_format: {
          type: "json_object",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "OpenRouter request failed:",
      response.status,
      errorText.slice(0, 1000),
    );

    throw new Error(
      `OpenRouter request failed with status ${response.status}.`,
    );
  }

  const payload: unknown = await response.json();

  const actualModel = isPlainObject(payload) &&
      typeof payload.model === "string"
    ? payload.model
    : BACKUP_MODEL;

  return {
    content: extractProviderContent(payload),
    provider: "OpenRouter",
    model: actualModel,
  };
}

// ======================================================
// PROVIDER SELECTION AND FALLBACK
// ======================================================

async function generateAIResponse(
  messages: ProviderRequestMessage[],
): Promise<AIResult> {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

  let groqError: unknown = null;

  if (groqKey) {
    try {
      return await callGroq(messages, groqKey);
    } catch (error) {
      groqError = error;

      console.error(
        "NYX is switching from Groq to its backup provider.",
      );
    }
  } else {
    console.error("GROQ_API_KEY is not configured.");
  }

  if (openRouterKey) {
    try {
      return await callOpenRouter(messages, openRouterKey);
    } catch (error) {
      console.error("OpenRouter backup failed:", error);
    }
  }

  if (!groqKey && !openRouterKey) {
    throw new Error("No NYX AI provider is configured.");
  }

  if (groqError) {
    throw new Error(
      "NYX could not get a response from its AI providers. Please try again.",
    );
  }

  throw new Error(
    "NYX could not get a response from its backup provider. Please try again.",
  );
}

// ======================================================
// PARSE AND VALIDATE NYX OUTPUT
// ======================================================

function parseNYXOutput(
  rawContent: string,
): ParsedNYXOutput {
  const cleaned = rawContent
    .replace(/^\uFEFF/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Some model responses include text around the JSON object.
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      return {
        response: cleaned.slice(0, 20000),
        deliverables: [],
        memoryUpdates: [],
      };
    }

    try {
      parsed = JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1),
      );
    } catch {
      return {
        response: cleaned.slice(0, 20000),
        deliverables: [],
        memoryUpdates: [],
      };
    }
  }

  if (!isPlainObject(parsed)) {
    return {
      response: cleaned.slice(0, 20000),
      deliverables: [],
      memoryUpdates: [],
    };
  }

  const response = safeText(parsed.response, 20000);

  return {
    response: response || "NYX could not prepare a readable response. Please try again.",
    deliverables: normalizeDeliverables(parsed.deliverables),
    memoryUpdates: normalizeMemoryUpdates(parsed.memoryUpdates),
  };
}

// ======================================================
// BUILD AI CONVERSATION MESSAGES
// ======================================================

function buildMessages(args: {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
}): ProviderRequestMessage[] {
  const messages: ProviderRequestMessage[] = [
    {
      role: "system",
      content: args.systemPrompt,
    },
  ];

  for (const item of args.history) {
    messages.push({
      role: item.role,
      content: item.content,
    });
  }

  messages.push({
    role: "user",
    content: args.message,
  });

  return messages;
}

// ======================================================
// RESEARCH STATUS
// ======================================================

function extractResearchSources(): never[] {
  // No live research provider is connected yet.
  // Never manufacture citations or source records.
  return [];
}

// ======================================================
// NYX CORE EDGE FUNCTION
// ======================================================

Deno.serve(async (request: Request): Promise<Response> => {
  // ----------------------------------------------------
  // CORS
  // ----------------------------------------------------

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Only POST requests are supported.",
      },
      405,
    );
  }

  try {
    // --------------------------------------------------
    // ENVIRONMENT CONFIGURATION
    // --------------------------------------------------

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "NYX database configuration is incomplete.",
      );
    }

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          error: "Please sign in before using NYX.",
        },
        401,
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return jsonResponse(
        {
          success: false,
          error: "Your session token is missing.",
        },
        401,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse(
        {
          success: false,
          error: "Your session is invalid or has expired. Please sign in again.",
        },
        401,
      );
    }

    const userId = authData.user.id;

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "The request body must contain valid JSON.",
        },
        400,
      );
    }

    if (!isPlainObject(body)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request data.",
        },
        400,
      );
    }

    // --------------------------------------------------
    // MEMORY SETTINGS ACTION
    // --------------------------------------------------

    if (body.action === "memory_settings") {
      const autoSaveEnabled = body.autoSaveEnabled;

      if (typeof autoSaveEnabled !== "boolean") {
        return jsonResponse(
          {
            success: false,
            error: "A valid automatic memory setting is required.",
          },
          400,
        );
      }

      const settings = await updateMemorySettings(
        supabase,
        userId,
        autoSaveEnabled,
      );

      return jsonResponse({
        success: true,
        settings,
      });
    }

    // --------------------------------------------------
    // MEMORY MANAGEMENT ACTION
    // --------------------------------------------------

    if (body.action === "memory") {
      const action = body.memoryAction;

      const allowedActions: MemoryAction[] = [
        "list",
        "create",
        "update",
        "delete",
        "delete_all",
      ];

      if (
        typeof action !== "string" ||
        !allowedActions.includes(action as MemoryAction)
      ) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid memory action.",
          },
          400,
        );
      }

      const memoryRequest: MemoryActionRequest = {
        action: action as MemoryAction,
        memoryId: safeText(body.memoryId, 128),
        projectId: body.projectId === undefined
          ? undefined
          : validateProjectId(body.projectId),
        studio: body.studio === undefined
          ? undefined
          : safeText(body.studio, 100),
        memoryType: body.memoryType === undefined
          ? undefined
          : validateMemoryType(body.memoryType),
        title: body.title === undefined
          ? undefined
          : safeText(body.title, 200),
        content: body.content === undefined
          ? undefined
          : safeContent(body.content),
      };

      const result = await handleMemoryAction(
        supabase,
        userId,
        memoryRequest,
      );

      return jsonResponse(result);
    }

    // --------------------------------------------------
    // NORMAL STUDIO REQUEST
    // --------------------------------------------------

    const message = validateMessage(body.message);

    const studio = getStudio(body.studioId);

    if (!studio) {
      return jsonResponse(
        {
          success: false,
          error: "Please select a valid NYX studio.",
        },
        400,
      );
    }

    const projectId = validateProjectId(
      body.projectId ?? null,
    );

    const studioContext = safeText(
      body.studioContext,
      MAX_STUDIO_CONTEXT,
    );

    const history = buildLimitedHistory(body.history);

    // --------------------------------------------------
    // MEMORY SETTINGS AND PROJECT MEMORIES
    // --------------------------------------------------

    const settings = await getMemorySettings(
      supabase,
      userId,
    );

    const memories = await retrieveProjectMemories(
      supabase,
      userId,
      projectId,
      studio.id,
    );

    const memoryContext = buildMemoryContext(memories);

    // --------------------------------------------------
    // ORCHESTRATION
    // --------------------------------------------------

    const orchestration = buildOrchestration(
      studio,
      message,
    );

    const researchRequested = isResearchRequest(message);

    // --------------------------------------------------
    // SYSTEM PROMPT
    // --------------------------------------------------

    const systemPrompt = createSystemPrompt({
      studio,
      studioContext,
      memoryContext,
      orchestration,
      researchRequested,
    });

    const messages = buildMessages({
      systemPrompt,
      history,
      message,
    });

    // --------------------------------------------------
    // AI GENERATION
    // --------------------------------------------------

    const aiResult = await generateAIResponse(messages);

    const output = parseNYXOutput(aiResult.content);

    // --------------------------------------------------
    // AUTOMATIC MEMORY SAVING
    // --------------------------------------------------

    let memorySavedCount = 0;

    if (
      settings.auto_save_enabled &&
      output.memoryUpdates.length > 0
    ) {
      const evidenceText = buildCreatorEvidenceText(
        message,
        history,
        studioContext,
      );

      memorySavedCount = await saveAutomaticMemories(
        supabase,
        userId,
        projectId,
        studio.id,
        output.memoryUpdates,
        evidenceText,
      );
    }

    // --------------------------------------------------
    // RESEARCH STATUS
    // --------------------------------------------------

    const sources = extractResearchSources();

    // --------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------

    return jsonResponse({
      success: true,
      response: output.response,

      provider: aiResult.provider,
      model: aiResult.model,

      studio: {
        id: studio.id,
        name: studio.name,
      },

      orchestration,

      deliverables: output.deliverables,

      researchRequested,
      researchAvailable: false,
      researchVerified: false,
      researchDate: null,
      sources,

      memoryAvailable: true,
      memorySaved: memorySavedCount > 0,
      memorySavedCount,
      autoSaveEnabled: settings.auto_save_enabled,

      projectId,
    });
  } catch (error) {
    console.error("NYX CORE request error:", error);

    const message = error instanceof Error
      ? error.message
      : "NYX could not complete your request.";

    const status =
      message.includes("Please enter") ||
      message.includes("Invalid") ||
      message.includes("required") ||
      message.includes("exceeds")
        ? 400
        : 500;

    return jsonResponse(
      {
        success: false,
        error: message,
      },
      status,
    );
  }
});
