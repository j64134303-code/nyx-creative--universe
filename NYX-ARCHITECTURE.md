NYX — THE CREATIVE UNIVERSE

Product Architecture & Development Blueprint

Product name: NYX
Vision: A unified creative universe where people can imagine, create, produce and manage creative projects through one intelligent platform.

Tagline: Imagine beyond. Create everything.

Document status: Initial architecture blueprint
Development approach: Mobile-first, modular, staged and test-driven.

---

1. THE VISION

NYX is an AI-powered creative platform that brings multiple creative tools together in one connected environment.

Users should not need to understand complicated software or navigate endless menus. They should be able to communicate naturally with NYX by typing or speaking.

NYX should understand what they want, identify the appropriate studio, assist with the creative process and display the actual result.

NYX is designed to begin as a private platform for a small number of invited users and grow into a global creative platform over time.

2. THE CORE EXPERIENCE

The home page must contain:

- NYX branding and a welcoming introduction.
- A natural-language conversation area.
- Text input for creative instructions.
- Voice-message recording.
- A visual directory of all 12 studios.
- A creation preview area.
- Essential account access.

The studios must be visible from the beginning.

Each studio must have:

- Its own visual thumbnail.
- A clearly readable name.
- A short explanation of its purpose.
- A working entry point into its creative workflow.

The interface must be responsive and designed for phones first, while supporting tablets and desktop screens.

The experience should feel elegant, modern, futuristic and creative without becoming crowded.

Users should be able to ask NYX to open studios, find projects, change settings and perform supported actions through conversation.

3. THE 12 CREATIVE STUDIOS

Studio 1 — Marketing & Advertising

Create marketing campaigns, advertisements, promotional materials, brand concepts, social media content and marketing strategies.

Studio 2 — Video Editing

Import, edit, arrange and produce videos. Support transitions, text, effects, subtitles, audio, timing and export.

Studio 3 — Film & Movie Production

Support film concepts, scripts, scene planning, storyboards, production workflows and video creation.

Studio 4 — Music & Beat Production

Create original beats, songs, instrumentals and music across global genres, including African regional styles such as gengetone, urbantone and mugithi. Support layering, sound design, mixing and mastering.

Studio 5 — Game Creation

Support game concepts, characters, environments, gameplay design, assets and development workflows.

Studio 6 — Storytelling & Voice

Create stories, books, scripts, dialogue and other written creative work. Support natural voice interaction.

Studio 7 — Audiobook Production

Turn written content into narrated audio. Support voice selection, chapter organization, audio previews and downloadable audiobook files.

Studio 8 — Character Creation

Create and develop characters, including their appearance, personality, backgrounds and consistency across creative projects.

Studio 9 — Soundtrack & Background Music

Create original soundtracks, background music, atmospheric audio and music suited to particular scenes or moods.

Studio 10 — Step Into The Scene

Allow creators to insert chosen characters into existing video clips and scenes, subject to appropriate ownership, permission and usage rights.

Studio 11 — Comedy & Humour

Create jokes, comedy scripts, skits, humorous stories, characters and entertainment concepts.

Studio 12 — Import & Export

Import supported creative files and export finished projects in appropriate formats. Preserve project information and avoid unnecessary quality loss.

4. THE NYX INTELLIGENCE SYSTEM

NYX must have a central intelligence layer responsible for:

- Understanding natural-language instructions.
- Maintaining relevant conversation context.
- Identifying the user's creative intention.
- Routing requests to the correct studio.
- Coordinating workflows across multiple studios.
- Asking useful follow-up questions when necessary.
- Remembering project-specific information.
- Explaining errors and offering recovery options.

A user should be able to request a project involving several studios.

For example, a user might request a short film. NYX could coordinate storytelling, character creation, soundtrack and video production.

The intelligence layer must be independent of any single AI provider so that models can be changed without rebuilding the entire platform.

5. TECHNICAL ARCHITECTURE

The proposed architecture is:

A. NYX Web Application

- React and Vite.
- Responsive mobile-first interface.
- Installable Progressive Web App (PWA).
- Conversational interface and studio directory.

B. NYX Intelligence Service

- Conversation management.
- AI provider integration.
- Studio routing.
- Voice processing.
- Project context.

C. Shared Creative Engine

- Project management.
- Asset management.
- Media processing.
- Reusable creative workflows.
- Studio-to-studio coordination.

D. Secure Data Layer

- User accounts.
- Project records.
- Settings.
- Permissions.
- File references.
- Usage records.

E. Twelve Modular Studios
Each studio must have its own identifiable functionality and workflow while sharing the common NYX infrastructure.

Proposed technology choices, subject to cost and feasibility verification:

- React + Vite for the frontend.
- Cloudflare Pages and Workers for hosting and backend services.
- Supabase for authentication and structured database services.
- Separate object storage for larger media files.
- Replaceable AI and media-generation providers.

These are proposed choices, not commitments to paid services. Verify current limits, pricing and compatibility before implementation.

6. ACCOUNTS AND SECURITY

NYX must support multiple users without exposing one user's private information or projects to another.

Requirements:

- Secure registration and authentication.
- Individual user accounts.
- Private project ownership.
- Permission checks on server-side operations.
- Secure handling of API keys.
- Rate limits and usage quotas.
- Protection against unauthorized access.
- Secure file uploads and downloads.
- Administrative controls.
- Appropriate activity and security records.

Provider API keys must never be exposed in frontend code.

The system must not rely on the assumption that a user interface restriction alone provides security.

7. PROJECTS AND STORAGE

Users must be able to:

- Create projects.
- Save work.
- Reopen previous projects.
- Rename projects.
- Organize creative assets.
- Import supported files.
- Export supported results.
- Continue unfinished work.

Projects must remain associated with the correct user.

Large audio and video files should be handled through suitable media storage rather than unnecessarily filling the main database.

The system must have a backup and recovery strategy before important user work is stored.

8. VOICE AND MEDIA GENERATION

Voice interaction should allow users to communicate naturally with NYX.

Planned capabilities include:

- Voice recording.
- Speech-to-text.
- Text-to-speech.
- Voice selection where supported.
- Audio previews.
- Downloadable audio outputs.

Media generation must produce genuine outputs through functioning engines or providers.

A decorative preview, simulated result or ordinary text response must never be presented as a completed video, song, image or other generated media.

When a capability is not connected, NYX must clearly explain that it is unavailable.

9. COST AND INITIAL CAPACITY

Initial development must prioritize affordability.

Initial target:

- Approximately 5–10 invited users.
- Owner's account free.
- Strict usage limits.
- Free or low-cost infrastructure where practical.
- No unnecessary paid subscriptions.
- No uncontrolled AI or media-generation spending.

The initial working budget is approximately KSh 500.

This budget must not be treated as sufficient for unlimited AI or media generation. Paid services must be disclosed and approved before use.

The architecture should allow usage limits, storage and processing capacity to increase as resources become available.

10. FUTURE EXPANSION

NYX must be structured so that future expansion does not require rebuilding the entire product.

Plan for:

- More users.
- Additional studios.
- New AI providers.
- New media-generation engines.
- Larger storage requirements.
- Different usage plans.
- International access.
- Additional languages.
- Future social and entertainment features.

Use modular services and clear interfaces between components.

11. DEVELOPMENT STAGES

Development must follow these stages in order.

Stage 0 — Architecture and Product Blueprint
Define the product, architecture, studio requirements, security, cost controls and testing criteria.

Stage 1 — Introduction and Conversational Interface
Build the NYX welcome experience, responsive interface, text and voice interaction controls, all 12 visual studio cards, creation preview area and PWA shell.

Stage 2 — Accounts, Security and Projects
Build authentication, user separation, permissions, project saving and reopening.

Stage 3 — NYX Intelligence and Voice
Build the conversational intelligence, context handling, studio routing and voice workflows.

Stage 4 — Shared Creative Engine
Build reusable project, asset and processing infrastructure.

Stage 5 — Studio Development
Build and test each studio individually. Do not skip studios or mark unfinished functions as complete.

Stage 6 — Real Media Generation
Integrate and test actual image, video, music, audio, voice and other generation engines.

Stage 7 — Social and Entertainment
Develop planned social and entertainment features.

Stage 8 — Integration, Security and Performance
Test the platform as a connected system.

Stage 9 — Launch and Expansion Readiness
Prepare for wider access, operational monitoring and future growth.

12. STUDIO QUALITY REQUIREMENTS

Every studio must pass its own testing and approval process before being considered complete.

Tests must cover:

1. Interface and mobile responsiveness.
2. Actual working functionality.
3. AI understanding of relevant instructions.
4. Saving and reopening projects.
5. Import and export where applicable.
6. Error handling and recovery.
7. Security and user permissions.
8. Integration with the rest of NYX.

A studio must not be marked complete because its page looks attractive or its code builds successfully.

Maintain a quality record using these statuses:

- NOT IMPLEMENTED
- IN PROGRESS
- PARTIALLY WORKING
- BROKEN
- FIXED — RETEST REQUIRED
- WORKING — TESTED
- APPROVED

Do not move to the next studio until the current studio has passed its required tests and received approval.

13. DEVELOPMENT RULES

- Build one stage at a time.
- Complete and test each stage before moving forward.
- Do not remove working functionality without a clear reason and an approved replacement.
- Back up important working versions.
- Inspect existing files before replacing them.
- Prefer complete, coordinated file changes over disconnected edits.
- Avoid unnecessary dependencies and expenses.
- Do not create buttons or controls that do nothing.
- Do not fake AI or media-generation results.
- Explain technical limitations honestly.
- Test on an actual mobile device.
- Record known problems and their resolutions.
- Protect user projects throughout development.

14. DEFINITION OF SUCCESS

NYX succeeds when a user can enter the platform, communicate naturally, select or be directed to a suitable studio, complete a real creative workflow, preview the actual result and save or export their work.

The studios must operate as parts of one connected creative universe rather than twelve unrelated decorative pages.

The goal is not simply to build a beautiful website. The goal is to build a functioning creative platform that can grow responsibly.
