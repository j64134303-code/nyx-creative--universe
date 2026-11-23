
export const STUDIO_REGISTRY = [
  {
    id: "film",
    name: "Film & Video Studio",
    category: "Visual Production",
    purpose: "Develop, plan and produce films, scenes, episodes and videos.",
    capabilities: [
      "Film concepts and scripts",
      "Scene and shot planning",
      "Storyboards and visual direction",
      "Cinematography planning",
      "Video production",
      "Editing and post-production"
    ],
    research: [
      "Film references",
      "Genres and visual styles",
      "Locations and settings",
      "Audience research",
      "Cinematography techniques"
    ],
    collaborators: ["characters", "animation", "audio", "music", "voice"],
    production: "Requires connected production tools for rendered video and editing."
  },
  {
    id: "music",
    name: "Music Studio",
    category: "Audio Production",
    purpose: "Create original music, beats, songs and sound compositions.",
    capabilities: [
      "Songwriting",
      "Beat creation",
      "Melody and arrangement",
      "Genre exploration",
      "Lyrics and composition",
      "Music production planning"
    ],
    research: [
      "Music genres",
      "Regional music styles",
      "Instruments",
      "Production techniques",
      "Musical trends"
    ],
    collaborators: ["audio", "voice", "film", "marketing"],
    production: "Requires a connected music-generation and audio-rendering service for finished tracks."
  },
  {
    id: "books",
    name: "Books & Storytelling Studio",
    category: "Writing",
    purpose: "Create, develop, edit and prepare books and stories for publication.",
    capabilities: [
      "Book writing",
      "Story development",
      "Chapter planning",
      "Editing and proofreading",
      "Worldbuilding",
      "Publishing preparation"
    ],
    research: [
      "Facts and subject research",
      "Historical references",
      "Genres and audiences",
      "Writing styles",
      "Publishing requirements"
    ],
    collaborators: ["characters", "voice", "audiobooks", "marketing"],
    production: "Supports writing and editing; publishing integrations require connection."
  },
  {
    id: "voice",
    name: "Voice Studio",
    category: "Voice Production",
    purpose: "Develop and produce expressive voices for narration and characters.",
    capabilities: [
      "Voice direction",
      "Character voice design",
      "Accent and delivery descriptions",
      "Dialogue performance planning",
      "Voice sample workflows",
      "Narration"
    ],
    research: [
      "Accent references",
      "Voice styles",
      "Character delivery",
      "Pronunciation",
      "Performance techniques"
    ],
    collaborators: ["books", "audiobooks", "film", "characters", "audio"],
    production: "Voice rendering requires a connected, rights-compliant voice service."
  },
  {
    id: "games",
    name: "Game Development Studio",
    category: "Interactive Production",
    purpose: "Design and develop interactive games and experiences.",
    capabilities: [
      "Game concepts",
      "Game mechanics",
      "Level design",
      "Character development",
      "Dialogue and quests",
      "Development planning"
    ],
    research: [
      "Game genres",
      "Player audiences",
      "Gameplay references",
      "Market trends",
      "Technical requirements"
    ],
    collaborators: ["characters", "animation", "music", "audio"],
    production: "Playable builds require connected development and testing tools."
  },
  {
    id: "marketing",
    name: "Marketing & Creative Campaign Studio",
    category: "Marketing",
    purpose: "Develop marketing strategies, campaigns and creative promotional material.",
    capabilities: [
      "Campaign planning",
      "Brand storytelling",
      "Advertising concepts",
      "Social media content",
      "Audience targeting",
      "Content calendars"
    ],
    research: [
      "Competitor research",
      "Audience behaviour",
      "Market trends",
      "Platform research",
      "Brand positioning"
    ],
    collaborators: ["film", "music", "books", "characters", "audio"],
    production: "Campaign publishing and advertising require connected platform integrations."
  },
  {
    id: "characters",
    name: "Character Creation Studio",
    category: "Creative Design",
    purpose: "Develop original characters with consistent identities and personalities.",
    capabilities: [
      "Character profiles",
      "Personalities and motivations",
      "Character backstories",
      "Dialogue development",
      "Visual descriptions",
      "Character relationships"
    ],
    research: [
      "Visual references",
      "Character archetypes",
      "Cultural and historical context",
      "Genre conventions",
      "Audience expectations"
    ],
    collaborators: ["books", "film", "games", "animation", "voice"],
    production: "Visual character rendering requires a connected image-generation service."
  },
  {
    id: "audio",
    name: "Audio Production Studio",
    category: "Audio Production",
    purpose: "Create, edit and organize sound for creative projects.",
    capabilities: [
      "Sound effects planning",
      "Sound design",
      "Audio editing",
      "Mixing direction",
      "Background ambience",
      "Audio post-production"
    ],
    research: [
      "Sound references",
      "Recording techniques",
      "Audio styles",
      "Acoustic environments",
      "Production methods"
    ],
    collaborators: ["film", "music", "voice", "animation", "audiobooks"],
    production: "Rendered audio and advanced editing require connected audio tools."
  },
  {
    id: "animation",
    name: "Animation Studio",
    category: "Visual Production",
    purpose: "Develop animated stories, characters and visual sequences.",
    capabilities: [
      "Animation concepts",
      "Character movement",
      "Scene planning",
      "Storyboards",
      "Motion direction",
      "Animation production planning"
    ],
    research: [
      "Animation styles",
      "Movement references",
      "Visual techniques",
      "Character design",
      "Audience trends"
    ],
    collaborators: ["characters", "film", "music", "audio", "voice"],
    production: "Rendered animation requires a connected animation or video-generation service."
  },
  {
    id: "comedy",
    name: "Comedy Studio",
    category: "Writing & Performance",
    purpose: "Develop original comedy, humour and entertaining performances.",
    capabilities: [
      "Comedy writing",
      "Sketch development",
      "Funny dialogue",
      "Character-based humour",
      "Stand-up material",
      "Comedy scripts"
    ],
    research: [
      "Comedy genres",
      "Audience humour",
      "Cultural context",
      "Performance references",
      "Comedy formats"
    ],
    collaborators: ["film", "books", "characters", "voice", "marketing"],
    production: "Recorded performances require connected audio or video tools."
  },
  {
    id: "audiobooks",
    name: "Audiobook Production Studio",
    category: "Audio Publishing",
    purpose: "Turn written books into polished, chapter-based audiobooks.",
    capabilities: [
      "Book preparation",
      "Chapter production",
      "Narrator selection",
      "Distinct character voices",
      "Pronunciation direction",
      "Audio quality planning",
      "Export preparation"
    ],
    research: [
      "Narration styles",
      "Voice references",
      "Pronunciation research",
      "Audiobook standards",
      "Audience preferences"
    ],
    collaborators: ["books", "voice", "audio", "characters"],
    production: "Finished downloadable audiobooks require a connected voice-rendering and audio-export service."
  },
  {
    id: "research",
    name: "Research & Discovery Studio",
    category: "Research",
    purpose: "Discover reliable information and creative references for every studio.",
    capabilities: [
      "Web research",
      "Source evaluation",
      "Reference discovery",
      "Trend analysis",
      "Fact checking",
      "Creative direction research"
    ],
    research: [
      "Reliable sources",
      "Industry developments",
      "Creative references",
      "Audience insights",
      "Evidence and facts"
    ],
    collaborators: [
      "film", "music", "books", "voice", "games",
      "marketing", "characters", "audio", "animation",
      "comedy", "audiobooks"
    ],
    production: "Research results can inform other studios; source access depends on connected research tools."
  }
];

export function getStudio(studioId) {
  return STUDIO_REGISTRY.find(studio => studio.id === studioId) || null;
}

export function getStudioNames() {
  return STUDIO_REGISTRY.map(studio => ({
    id: studio.id,
    name: studio.name
  }));
}

export function getStudioCollaborators(studioId) {
  const studio = getStudio(studioId);

  if (!studio) return [];

  return studio.collaborators
    .map(id => getStudio(id))
    .filter(Boolean);
}
