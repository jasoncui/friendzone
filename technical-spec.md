# The Friend Group App — Technical Specification

## 1. Overview

The Friend Group App is a mobile-first messaging platform designed exclusively for close friend groups. Unlike existing chat apps that treat conversations as flat lists, it introduces typed conversation channels (Hangout, Event, Bracket), fluid conversation forking, emoji-driven actions, an AI mascot called Senpai, and integrated bill splitting, Spotify, and daily games tracking.

The stack is Next.js with Tailwind CSS on the frontend and Convex as the real-time backend for messaging, presence, and all data persistence.

---

## 2. Architecture

### 2.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────┐
│  Client (Next.js App Router + Tailwind)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Layouts   │ │ Pages    │ │ Components           │ │
│  │ (shell,   │ │ /group/  │ │ MessageFeed,         │ │
│  │  nav,     │ │ /channel/│ │ ChannelSidebar,      │ │
│  │  auth)    │ │ /bracket/│ │ Bracket, EventPanel, │ │
│  └──────────┘ └──────────┘ │ SenpaiAvatar, etc.   │ │
│                             └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐│
│  │ Convex React Hooks (useQuery, useMutation,       ││
│  │ useAction, usePaginatedQuery)                    ││
│  └──────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────┘
                        │ WebSocket (real-time sync)
                        ▼
┌─────────────────────────────────────────────────────┐
│  Convex Backend                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Queries  │ │ Mutations│ │ Actions              │ │
│  │ (reads)  │ │ (writes) │ │ (external APIs,      │ │
│  │          │ │          │ │  Senpai AI, OCR,     │ │
│  │          │ │          │ │  Spotify, Venmo)     │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐│
│  │ Scheduled Functions (cron)                       ││
│  │  - Event auto-archive                            ││
│  │  - Senpai scheduled messages                     ││
│  │  - Bracket round advancement                     ││
│  └──────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────┐│
│  │ File Storage (images, receipts, media)           ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
   ┌───────────┐ ┌───────────┐ ┌────────────┐
   │ Clerk     │ │ Spotify   │ │ OpenAI /   │
   │ Auth      │ │ Web API   │ │ Anthropic  │
   └───────────┘ └───────────┘ │ (Senpai)   │
                               └────────────┘
```

### 2.2 Tech Stack Details

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 14+ (App Router) | Server components for initial load, client components for real-time UI |
| Styling | Tailwind CSS + CSS variables | Utility-first with theming via CSS custom properties for group-specific color schemes |
| Animations | Framer Motion | Thread expansion, bracket transitions, emoji action effects |
| State management | Convex React hooks | No Redux or Zustand needed; Convex handles real-time subscriptions natively |
| Backend / database | Convex | Real-time subscriptions, transactional mutations, scheduled functions, file storage, full-text search — all in one |
| Authentication | Clerk (via Convex integration) | Social logins, phone auth for consumer app; Convex has first-class Clerk support |
| Push notifications | Expo Push / Web Push API | Triggered by Convex actions on message send |
| AI (Senpai) | Anthropic Claude API (or OpenAI) | Called from Convex actions; context built from group history |
| Image OCR | Convex action calling Google Cloud Vision or Tesseract | Receipt scanning for bill splits |
| File storage | Convex built-in file storage | Images, videos, receipts with automatic URL generation |

### 2.3 Project Structure

```
friend-group-app/
├── convex/
│   ├── schema.ts                 # Full database schema
│   ├── auth.config.ts            # Clerk integration
│   ├── _generated/               # Auto-generated types
│   │
│   ├── users.ts                  # User queries/mutations
│   ├── groups.ts                 # Group CRUD, membership
│   ├── channels.ts               # Channel creation, archiving, forking
│   ├── messages.ts               # Send, react, pin, paginated reads
│   ├── threads.ts                # Thread replies, promotion to fork
│   ├── brackets.ts               # Bracket lifecycle, voting, advancement
│   ├── events.ts                 # Event RSVP, checklists, archiving
│   ├── splits.ts                 # Bill splitting, receipt OCR, settlements
│   ├── reactions.ts              # Emoji actions (instant + threshold)
│   ├── hallOfFame.ts             # Enshrined message management
│   ├── spotify.ts                # Now Playing, playlists, jam links
│   ├── dailyGames.ts             # Wordle/Connections/Mini score parsing
│   ├── senpai.ts                 # AI mascot logic, scheduled messages
│   ├── media.ts                  # File upload, shared media timeline
│   ├── notifications.ts          # Push notification dispatch
│   ├── presence.ts               # Online/active status tracking
│   │
│   ├── crons.ts                  # Scheduled jobs
│   └── lib/
│       ├── permissions.ts        # Group membership checks
│       ├── senpaiPrompt.ts       # System prompt builder for Senpai
│       ├── gameParser.ts         # Wordle/Connections score regex
│       └── receiptOcr.ts         # OCR action wrapper
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (ConvexProvider, ClerkProvider)
│   │   ├── page.tsx              # Landing / group selector
│   │   ├── sign-in/              # Clerk sign-in page
│   │   ├── sign-up/              # Clerk sign-up page
│   │   │
│   │   └── g/[groupId]/
│   │       ├── layout.tsx        # Group shell (sidebar, nav, presence bar)
│   │       ├── page.tsx          # Redirects to hangout channel
│   │       │
│   │       ├── channel/[channelId]/
│   │       │   ├── page.tsx      # Unified message feed (Hangout or Event)
│   │       │   └── thread/[messageId]/
│   │       │       └── page.tsx  # Thread bottom-sheet view
│   │       │
│   │       ├── bracket/[bracketId]/
│   │       │   └── page.tsx      # Bracket tournament view
│   │       │
│   │       ├── hall-of-fame/
│   │       │   └── page.tsx      # Hall of Fame gallery
│   │       │
│   │       ├── media/
│   │       │   └── page.tsx      # Shared media timeline
│   │       │
│   │       ├── splits/
│   │       │   └── page.tsx      # Active/settled splits
│   │       │
│   │       └── settings/
│   │           └── page.tsx      # Group settings, Senpai config
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── MessageFeed.tsx         # Virtualized message list
│   │   │   ├── MessageBubble.tsx       # Individual message with reactions
│   │   │   ├── MessageComposer.tsx     # Input bar with media picker
│   │   │   ├── ThreadChip.tsx          # "3 replies" inline indicator
│   │   │   ├── ThreadBottomSheet.tsx   # Slide-up thread panel
│   │   │   ├── ReactionPicker.tsx      # Emoji picker with action emojis
│   │   │   └── ForkBanner.tsx          # "This forked from #hangout" link
│   │   │
│   │   ├── channels/
│   │   │   ├── ChannelSidebar.tsx      # Channel list grouped by type
│   │   │   ├── ChannelHeader.tsx       # Title, type badge, members
│   │   │   ├── HangoutHeader.tsx       # Now Playing strip
│   │   │   ├── EventHeader.tsx         # Date, RSVP count, countdown
│   │   │   └── CreateChannelModal.tsx  # New channel type picker
│   │   │
│   │   ├── bracket/
│   │   │   ├── BracketView.tsx         # Tournament bracket visual
│   │   │   ├── BracketMatchup.tsx      # Single matchup card
│   │   │   ├── BracketVoteButton.tsx   # Vote CTA
│   │   │   └── BracketResult.tsx       # Winner announcement
│   │   │
│   │   ├── event/
│   │   │   ├── RsvpTracker.tsx         # RSVP status grid
│   │   │   ├── Checklist.tsx           # Who's bringing what
│   │   │   ├── PhotoAlbum.tsx          # Auto-collected gallery
│   │   │   └── SchedulingPoll.tsx      # Date picker / availability
│   │   │
│   │   ├── splits/
│   │   │   ├── ReceiptScanner.tsx      # Camera + OCR upload
│   │   │   ├── ItemClaimer.tsx         # Tap-to-claim items
│   │   │   ├── SplitSummary.tsx        # Net balances
│   │   │   └── VenmoDeepLink.tsx       # One-tap pay button
│   │   │
│   │   ├── senpai/
│   │   │   ├── SenpaiAvatar.tsx        # Animated mascot
│   │   │   ├── SenpaiMessage.tsx       # Styled AI message bubble
│   │   │   └── SenpaiSettings.tsx      # Frequency slider, personality
│   │   │
│   │   ├── spotify/
│   │   │   ├── NowPlayingStrip.tsx     # Horizontal scroller
│   │   │   ├── SharedPlaylist.tsx      # Playlist viewer
│   │   │   └── JamCard.tsx             # Rich Spotify Jam embed
│   │   │
│   │   ├── games/
│   │   │   ├── DailyLeaderboard.tsx    # Today's scores
│   │   │   ├── StreakTracker.tsx        # Streaks and averages
│   │   │   └── HeadToHead.tsx          # Player comparison
│   │   │
│   │   ├── hall-of-fame/
│   │   │   ├── HallOfFameGallery.tsx   # Browsable enshrined messages
│   │   │   └── EnshrineAnimation.tsx   # Trophy animation on induction
│   │   │
│   │   └── ui/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── BottomSheet.tsx
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── Skeleton.tsx
│   │
│   ├── hooks/
│   │   ├── useGroupPermissions.ts
│   │   ├── usePresence.ts
│   │   ├── useMessageScroll.ts
│   │   └── useSpotifyAuth.ts
│   │
│   ├── lib/
│   │   ├── convex.ts             # ConvexReactClient setup
│   │   ├── utils.ts              # Shared utilities
│   │   └── constants.ts          # Emoji action mappings, thresholds
│   │
│   └── styles/
│       └── globals.css           # Tailwind directives + CSS variables
│
├── public/
│   └── ...
│
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Database Schema (Convex)

### 3.1 Complete Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ─── USERS ───────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    spotifyRefreshToken: v.optional(v.string()),
    spotifyDisplayName: v.optional(v.string()),
    pushToken: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  // ─── GROUPS ──────────────────────────────────────────────
  groups: defineTable({
    name: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    senpaiEnabled: v.boolean(),
    senpaiFrequency: v.union(
      v.literal("quiet"),
      v.literal("normal"),
      v.literal("chatty")
    ),
    senpaiPersonality: v.optional(v.string()),  // custom personality notes
    inviteCode: v.string(),                     // shareable join code
  })
    .index("by_inviteCode", ["inviteCode"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
    nickname: v.optional(v.string()),           // group-specific display name
    lastActiveAt: v.number(),                   // for watercooler notifications
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  // ─── CHANNELS ────────────────────────────────────────────
  channels: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    type: v.union(
      v.literal("hangout"),
      v.literal("event"),
      v.literal("bracket")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),

    // Fork relationships
    parentChannelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),   // message that spawned this fork
    forkDepth: v.number(),                           // 0 = top-level, 1 = forked, etc.

    // State
    isArchived: v.boolean(),
    archivedAt: v.optional(v.number()),

    // Event-specific fields
    eventDate: v.optional(v.number()),               // unix timestamp
    eventEndDate: v.optional(v.number()),
    eventLocation: v.optional(v.string()),

    // Bracket-specific fields
    bracketQuestion: v.optional(v.string()),
    bracketStatus: v.optional(
      v.union(
        v.literal("nominating"),
        v.literal("voting"),
        v.literal("complete")
      )
    ),
    bracketWinner: v.optional(v.string()),

    // Spotify integration
    spotifyPlaylistId: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_group_type", ["groupId", "type"])
    .index("by_parent", ["parentChannelId"])
    .index("by_group_archived", ["groupId", "isArchived"]),

  // ─── MESSAGES ────────────────────────────────────────────
  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    isDeleted: v.boolean(),

    // Thread support
    threadParentId: v.optional(v.id("messages")),    // null = top-level message
    threadReplyCount: v.number(),                    // denormalized for chips
    threadLastReplyAt: v.optional(v.number()),

    // Fork tracking
    forkedToChannelId: v.optional(v.id("channels")), // if this message spawned a fork

    // Media
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    mediaTypes: v.optional(v.array(v.string())),     // "image", "video", "file"

    // Link previews
    linkUrl: v.optional(v.string()),
    linkTitle: v.optional(v.string()),
    linkImage: v.optional(v.string()),

    // Special message types
    messageType: v.union(
      v.literal("text"),
      v.literal("system"),       // "Sarah created an event"
      v.literal("senpai"),       // Senpai's messages
      v.literal("bracket_result"), // "🏆 Om Indian wins!"
      v.literal("game_score"),   // Parsed Wordle/Connections
      v.literal("split_request") // Bill split notification
    ),

    // Game score metadata (if messageType == "game_score")
    gameData: v.optional(v.object({
      game: v.string(),           // "wordle", "connections", "mini"
      score: v.number(),
      attempts: v.optional(v.number()),
      date: v.string(),           // game date like "2025-02-20"
      rawText: v.string(),        // original pasted text
    })),

    // Senpai metadata
    senpaiTrigger: v.optional(v.string()),            // what triggered senpai
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_channel_toplevel", ["channelId", "threadParentId", "createdAt"])
    .index("by_thread", ["threadParentId", "createdAt"])
    .index("by_author", ["authorId", "createdAt"])
    .searchIndex("search_body", {
      searchField: "body",
      filterFields: ["channelId"],
    }),

  // ─── REACTIONS ───────────────────────────────────────────
  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),                               // unicode emoji
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_emoji", ["messageId", "emoji"])
    .index("by_message_user", ["messageId", "userId"]),

  // ─── PINS ────────────────────────────────────────────────
  pins: defineTable({
    channelId: v.id("channels"),
    messageId: v.id("messages"),
    pinnedBy: v.id("users"),
    pinnedAt: v.number(),
  })
    .index("by_channel", ["channelId", "pinnedAt"]),

  // ─── HALL OF FAME ────────────────────────────────────────
  hallOfFame: defineTable({
    groupId: v.id("groups"),
    messageId: v.id("messages"),
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),                                // snapshot of message text
    trophyCount: v.number(),                         // how many 🏆 reactions
    enshrineDate: v.number(),
  })
    .index("by_group", ["groupId", "enshrineDate"]),

  // ─── BRACKETS ────────────────────────────────────────────
  bracketEntries: defineTable({
    channelId: v.id("channels"),
    name: v.string(),                                // option text
    nominatedBy: v.id("users"),
    seed: v.optional(v.number()),                    // assigned after nomination
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"]),

  bracketMatchups: defineTable({
    channelId: v.id("channels"),
    round: v.number(),                               // 1, 2, 3...
    position: v.number(),                            // position within the round
    entryA: v.string(),                              // option name
    entryB: v.string(),
    votesA: v.number(),
    votesB: v.number(),
    winner: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("complete")
    ),
    votingDeadline: v.optional(v.number()),
  })
    .index("by_channel_round", ["channelId", "round"]),

  bracketVotes: defineTable({
    matchupId: v.id("bracketMatchups"),
    userId: v.id("users"),
    vote: v.string(),                                // entry name they voted for
    createdAt: v.number(),
  })
    .index("by_matchup", ["matchupId"])
    .index("by_matchup_user", ["matchupId", "userId"]),

  // ─── EVENTS ──────────────────────────────────────────────
  eventRsvps: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("not_going")
    ),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_user", ["channelId", "userId"]),

  eventChecklist: defineTable({
    channelId: v.id("channels"),
    item: v.string(),
    assignedTo: v.optional(v.id("users")),
    isCompleted: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"]),

  // ─── BILL SPLITS ─────────────────────────────────────────
  splits: defineTable({
    channelId: v.id("channels"),                     // event channel
    groupId: v.id("groups"),
    name: v.string(),                                // "Dinner at Om Indian"
    totalAmount: v.number(),                         // cents
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),
    receiptStorageId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.union(
      v.literal("claiming"),
      v.literal("calculated"),
      v.literal("settled")
    ),
  })
    .index("by_channel", ["channelId"])
    .index("by_group", ["groupId"]),

  splitItems: defineTable({
    splitId: v.id("splits"),
    name: v.string(),
    price: v.number(),                               // cents
    quantity: v.number(),
    claimedBy: v.optional(v.array(v.id("users"))),   // users who had this item
  })
    .index("by_split", ["splitId"]),

  splitBalances: defineTable({
    splitId: v.id("splits"),
    groupId: v.id("groups"),
    fromUserId: v.id("users"),                       // who owes
    toUserId: v.id("users"),                         // who is owed
    amount: v.number(),                              // cents
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()),
  })
    .index("by_split", ["splitId"])
    .index("by_group_unpaid", ["groupId", "isPaid"])
    .index("by_from_user", ["fromUserId", "isPaid"]),

  // ─── SPOTIFY ─────────────────────────────────────────────
  nowPlaying: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    trackName: v.string(),
    artistName: v.string(),
    albumArtUrl: v.optional(v.string()),
    spotifyUri: v.string(),
    isPlaying: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_group", ["groupId", "updatedAt"])
    .index("by_user_group", ["userId", "groupId"]),

  // ─── DAILY GAMES ─────────────────────────────────────────
  gameScores: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    game: v.string(),                                // "wordle", "connections", "mini"
    date: v.string(),                                // "2025-02-20"
    score: v.number(),
    attempts: v.optional(v.number()),
    messageId: v.id("messages"),
    createdAt: v.number(),
  })
    .index("by_group_game_date", ["groupId", "game", "date"])
    .index("by_user_game", ["userId", "game", "createdAt"]),

  // ─── PRESENCE ────────────────────────────────────────────
  presence: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    channelId: v.optional(v.id("channels")),
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("offline")
    ),
    lastSeenAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user_group", ["userId", "groupId"]),

  // ─── SENPAI ──────────────────────────────────────────────
  senpaiMemory: defineTable({
    groupId: v.id("groups"),
    memoryType: v.union(
      v.literal("inside_joke"),
      v.literal("running_bit"),
      v.literal("preference"),
      v.literal("milestone")
    ),
    content: v.string(),                             // natural language memory
    sourceMessageIds: v.optional(v.array(v.id("messages"))),
    createdAt: v.number(),
    relevanceScore: v.number(),                      // decays over time, boosted by references
  })
    .index("by_group", ["groupId", "relevanceScore"]),

  // ─── NOTIFICATIONS ───────────────────────────────────────
  notifications: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    channelId: v.optional(v.id("channels")),
    type: v.union(
      v.literal("message"),
      v.literal("mention"),
      v.literal("reaction"),
      v.literal("event_rsvp"),
      v.literal("bracket_vote"),
      v.literal("split_request"),
      v.literal("hall_of_fame"),
      v.literal("senpai")
    ),
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user_unread", ["userId", "isRead", "createdAt"]),
});
```

---

## 4. Core Feature Specifications

### 4.1 Channel Types

#### 4.1.1 Hangout Channel

The Hangout is the always-on home base for the group. Every group gets exactly one Hangout channel created automatically at group creation. It cannot be deleted or archived.

**Behavior:**

- Watercooler notifications: When a message is sent, only notify members whose `lastActiveAt` in `groupMembers` is within the last 48 hours. Members who haven't been active recently are not pinged, reducing notification fatigue. The threshold is configurable per group (24h, 48h, 72h, 1 week).
- The Hangout displays the Now Playing strip at the top showing Spotify listening activity for all connected members. This component polls each user's `nowPlaying` record via a Convex query subscribed in real time.
- Senpai lives in the Hangout and posts messages here (never in Events or Brackets unless explicitly tagged).
- The Hangout channel is the default landing page when opening the group.

**Convex implementation — watercooler notification logic:**

```typescript
// convex/notifications.ts
export const sendMessageNotifications = internalMutation({
  args: { channelId: v.id("channels"), authorId: v.id("users"), messageBody: v.string() },
  handler: async (ctx, { channelId, authorId, messageBody }) => {
    const channel = await ctx.db.get(channelId);
    const group = await ctx.db.get(channel.groupId);

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", q => q.eq("groupId", channel.groupId))
      .collect();

    const now = Date.now();
    const WATERCOOLER_WINDOW = 48 * 60 * 60 * 1000; // 48 hours

    for (const member of members) {
      if (member.userId === authorId) continue;

      // Hangout uses watercooler logic
      if (channel.type === "hangout") {
        const isRecentlyActive = (now - member.lastActiveAt) < WATERCOOLER_WINDOW;
        if (!isRecentlyActive) continue;
      }

      await ctx.db.insert("notifications", {
        userId: member.userId,
        groupId: channel.groupId,
        channelId,
        type: "message",
        title: `${group.name}`,
        body: messageBody.substring(0, 100),
        isRead: false,
        createdAt: now,
      });
    }
  },
});
```

#### 4.1.2 Event Channel

Event channels are date-bound and auto-archive once the event date has passed. Content remains searchable after archiving.

**Lifecycle:**
1. Created manually or forked from a message (e.g., someone says "we should do something for Jason's birthday" and someone reacts with 📅).
2. Active period: RSVP tracking, checklists, scheduling tools, chat, photo uploads, and bill splitting are all available.
3. Post-event: A Convex cron job checks daily for events whose `eventEndDate` (or `eventDate` + 24 hours if no end date) has passed. It sets `isArchived = true` and `archivedAt = Date.now()`. The channel moves to an "Archived" section in the sidebar. Messages remain searchable via the full-text search index.

**RSVP tracking** uses the `eventRsvps` table. The `RsvpTracker` component renders a grid of member avatars color-coded by status (green = going, yellow = maybe, gray = not going, outline = no response).

**Checklists** use the `eventChecklist` table. Items can be created by anyone. Users claim items by setting `assignedTo` to their user ID. The UI shows unclaimed items prominently.

**Photo album** is populated by querying all messages in the channel that have `mediaStorageIds` with image types. The `PhotoAlbum` component renders these in a masonry grid using the Convex file URL getter.

**Bill splitting** is described in detail in section 4.6.

**Auto-archive cron:**

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "archive-past-events",
  { hourUTC: 6, minuteUTC: 0 },
  internal.events.archivePastEvents
);

export default crons;
```

```typescript
// convex/events.ts
export const archivePastEvents = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const eventChannels = await ctx.db
      .query("channels")
      .withIndex("by_group_type")
      .filter(q =>
        q.and(
          q.eq(q.field("type"), "event"),
          q.eq(q.field("isArchived"), false),
          q.neq(q.field("eventDate"), undefined)
        )
      )
      .collect();

    for (const channel of eventChannels) {
      const endTime = channel.eventEndDate ?? (channel.eventDate! + 24 * 60 * 60 * 1000);
      if (now > endTime) {
        await ctx.db.patch(channel._id, {
          isArchived: true,
          archivedAt: now,
        });
      }
    }
  },
});
```

#### 4.1.3 Bracket Channel

A bracket is a tournament-style decision mechanism. It runs through nomination, voting rounds, and posts the final winner back to the parent channel.

**Lifecycle:**
1. **Creation**: Spawned from a message via the 🗳 emoji action or manually. The `bracketQuestion` field stores the prompt (e.g., "Where are we eating for Jason's birthday?").
2. **Nomination phase** (`bracketStatus = "nominating"`): Members submit options, stored in `bracketEntries`. A "Lock entries" action transitions to voting.
3. **Voting phase** (`bracketStatus = "voting"`): The system generates `bracketMatchups` based on entry count. Entries are seeded randomly. Each round's matchups become active sequentially. Members vote once per matchup, stored in `bracketVotes`. When all votes are in (or a deadline passes), the winner advances and the next matchup activates.
4. **Completion** (`bracketStatus = "complete"`): The final winner is written to `bracketWinner`. A system message of type `bracket_result` is posted to the parent channel with the result.

**Bracket generation logic:**

```typescript
// convex/brackets.ts
export const lockAndGenerateBracket = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .collect();

    // Shuffle for random seeding
    const shuffled = entries.sort(() => Math.random() - 0.5);

    // Pad to nearest power of 2 with byes
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
    const paddedEntries = [...shuffled.map(e => e.name)];
    while (paddedEntries.length < bracketSize) {
      paddedEntries.push("BYE");
    }

    // Generate round 1 matchups
    const round1Matchups: Array<{ entryA: string; entryB: string }> = [];
    for (let i = 0; i < paddedEntries.length; i += 2) {
      round1Matchups.push({
        entryA: paddedEntries[i],
        entryB: paddedEntries[i + 1],
      });
    }

    for (let i = 0; i < round1Matchups.length; i++) {
      const matchup = round1Matchups[i];
      const isBye = matchup.entryB === "BYE";

      await ctx.db.insert("bracketMatchups", {
        channelId,
        round: 1,
        position: i,
        entryA: matchup.entryA,
        entryB: matchup.entryB,
        votesA: 0,
        votesB: 0,
        winner: isBye ? matchup.entryA : undefined,
        status: isBye ? "complete" : "active",
      });
    }

    await ctx.db.patch(channelId, { bracketStatus: "voting" });
  },
});
```

**Bracket voting with automatic advancement:**

```typescript
export const castVote = mutation({
  args: {
    matchupId: v.id("bracketMatchups"),
    vote: v.string(),
  },
  handler: async (ctx, { matchupId, vote }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserByClerkId(ctx, identity!.subject);

    // Check for existing vote
    const existingVote = await ctx.db
      .query("bracketVotes")
      .withIndex("by_matchup_user", q =>
        q.eq("matchupId", matchupId).eq("userId", user._id)
      )
      .first();

    if (existingVote) throw new Error("Already voted on this matchup");

    const matchup = await ctx.db.get(matchupId);
    if (matchup.status !== "active") throw new Error("Matchup is not active");

    // Record vote
    await ctx.db.insert("bracketVotes", {
      matchupId,
      userId: user._id,
      vote,
      createdAt: Date.now(),
    });

    // Update vote count
    const field = vote === matchup.entryA ? "votesA" : "votesB";
    await ctx.db.patch(matchupId, {
      [field]: matchup[field] + 1,
    });

    // Check if all eligible members have voted
    const channel = await ctx.db.get(matchup.channelId);
    const memberCount = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", q => q.eq("groupId", channel.groupId))
      .collect();

    const voteCount = await ctx.db
      .query("bracketVotes")
      .withIndex("by_matchup", q => q.eq("matchupId", matchupId))
      .collect();

    if (voteCount.length + 1 >= memberCount.length) {
      await advanceMatchup(ctx, matchupId);
    }
  },
});
```

### 4.2 Conversation Forking

Forking is the core mechanic that turns flat chat into structured conversation. A fork creates a new channel linked to the message that spawned it.

**How forks are created:**

1. **Emoji action**: A user reacts with 🔀 on a message. This immediately creates a new channel with `parentChannelId` and `parentMessageId` set. The original message gets `forkedToChannelId` set. A system message appears in the parent channel: "Forked to #new-channel-name."
2. **Thread promotion**: When a thread accumulates 3+ 🧵 reactions, it is promoted to a fork. All thread replies are migrated to the new channel as top-level messages.
3. **Senpai suggestion**: Senpai detects a "we should..." pattern and suggests creating an Event or Bracket fork. The user confirms with a tap.

**Fork creation mutation:**

```typescript
// convex/channels.ts
export const forkFromMessage = mutation({
  args: {
    messageId: v.id("messages"),
    channelType: v.union(
      v.literal("hangout"),
      v.literal("event"),
      v.literal("bracket")
    ),
    name: v.string(),
    eventDate: v.optional(v.number()),
    bracketQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserByClerkId(ctx, identity!.subject);
    const message = await ctx.db.get(args.messageId);
    const parentChannel = await ctx.db.get(message.channelId);

    // Create the forked channel
    const newChannelId = await ctx.db.insert("channels", {
      groupId: parentChannel.groupId,
      name: args.name,
      type: args.channelType,
      createdBy: user._id,
      createdAt: Date.now(),
      parentChannelId: parentChannel._id,
      parentMessageId: args.messageId,
      forkDepth: parentChannel.forkDepth + 1,
      isArchived: false,
      eventDate: args.eventDate,
      bracketQuestion: args.bracketQuestion,
      bracketStatus: args.channelType === "bracket" ? "nominating" : undefined,
    });

    // Update original message to link to fork
    await ctx.db.patch(args.messageId, {
      forkedToChannelId: newChannelId,
    });

    // Post system message in parent channel
    await ctx.db.insert("messages", {
      channelId: parentChannel._id,
      authorId: user._id,
      body: `Forked to #${args.name}`,
      createdAt: Date.now(),
      isDeleted: false,
      threadReplyCount: 0,
      messageType: "system",
    });

    return newChannelId;
  },
});
```

**Fork result posting**: When a bracket completes or an event resolves, a result message is posted back to the parent channel. The `ForkBanner` component at the top of a forked channel shows a link back to the parent message for context.

### 4.3 Thread → Fork → Channel Fluid Transitions

Conversations exist on a spectrum of formality:

| Level | Structure | Behavior |
|---|---|---|
| **Thread** | Inline side conversation | Replies appear as a "3 replies" chip on the parent message. Tapping opens a bottom sheet. |
| **Fork** | Own space, linked to parent | Has its own channel with a back-link. Updates post back to parent. |
| **Channel** | Top-level standalone | Fully independent. No parent link. |

**Promotion rules:**

- **Thread → Fork**: Automatic when 3+ members react with 🧵 on the thread parent message. Or manual via the 🔀 emoji action on the parent. All thread replies are migrated to the new channel. The thread parent message gets a "Continued in #channel" indicator.
- **Fork → Channel**: Manual action in channel settings. Removes the `parentChannelId` link. The channel becomes top-level.
- **Fork → Summary collapse**: When a fork resolves (bracket completes, event archives), it can collapse back to a summary card in the parent channel showing the outcome.

**Thread migration mutation:**

```typescript
// convex/threads.ts
export const promoteThreadToFork = mutation({
  args: { parentMessageId: v.id("messages"), channelName: v.string() },
  handler: async (ctx, { parentMessageId, channelName }) => {
    const parentMessage = await ctx.db.get(parentMessageId);
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserByClerkId(ctx, identity!.subject);

    // Create fork channel
    const forkChannelId = await ctx.db.insert("channels", {
      groupId: (await ctx.db.get(parentMessage.channelId)).groupId,
      name: channelName,
      type: "hangout",
      createdBy: user._id,
      createdAt: Date.now(),
      parentChannelId: parentMessage.channelId,
      parentMessageId,
      forkDepth: 1,
      isArchived: false,
    });

    // Migrate thread replies to new channel as top-level messages
    const threadReplies = await ctx.db
      .query("messages")
      .withIndex("by_thread", q => q.eq("threadParentId", parentMessageId))
      .collect();

    for (const reply of threadReplies) {
      await ctx.db.patch(reply._id, {
        channelId: forkChannelId,
        threadParentId: undefined,
      });
    }

    // Update parent message
    await ctx.db.patch(parentMessageId, {
      forkedToChannelId: forkChannelId,
      threadReplyCount: 0,
    });

    return forkChannelId;
  },
});
```

### 4.4 Emoji Actions

Reactions are not just expressions — certain emojis trigger system actions. They fall into two categories.

**Instant actions (one tap):**

| Emoji | Action | Implementation |
|---|---|---|
| 📌 | Pin message to channel | Inserts into `pins` table. Pinned messages appear in a slide-out panel. |
| 🔀 | Fork message to new channel | Calls `forkFromMessage` mutation. Opens a modal to name the fork and select type. |
| 📅 | Create event from message | Calls `forkFromMessage` with `type: "event"`. Opens date picker modal. |
| 🎵 | Add Spotify link to shared playlist | If message contains a Spotify URL, calls `addToPlaylist` action. |
| 🗳 | Start bracket from message | Calls `forkFromMessage` with `type: "bracket"`. Uses message text as the question. |

**Threshold actions (need multiple people):**

| Emoji | Threshold | Action |
|---|---|---|
| 🔥 | 3+ unique reactors | Triggers a visual fire effect animation on the message (CSS animation, purely cosmetic). |
| 🏆 | 5+ unique reactors | Inserts the message into `hallOfFame`. Triggers an enshrinement animation. |
| 🧵 | 3+ unique reactors | Promotes the thread to a fork (calls `promoteThreadToFork`). |

**Reaction mutation with action dispatch:**

```typescript
// convex/reactions.ts
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserByClerkId(ctx, identity!.subject);

    // Prevent duplicate
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message_user", q =>
        q.eq("messageId", messageId).eq("userId", user._id)
      )
      .filter(q => q.eq(q.field("emoji"), emoji))
      .first();

    if (existing) return;

    await ctx.db.insert("reactions", {
      messageId,
      userId: user._id,
      emoji,
      createdAt: Date.now(),
    });

    // Check for instant actions
    const INSTANT_ACTIONS: Record<string, string> = {
      "📌": "pin",
      "🔀": "fork",
      "📅": "event",
      "🎵": "queue",
      "🗳": "bracket",
    };

    if (INSTANT_ACTIONS[emoji]) {
      await handleInstantAction(ctx, messageId, user._id, INSTANT_ACTIONS[emoji]);
    }

    // Check for threshold actions
    const THRESHOLD_ACTIONS: Record<string, { threshold: number; action: string }> = {
      "🔥": { threshold: 3, action: "fire_effect" },
      "🏆": { threshold: 5, action: "hall_of_fame" },
      "🧵": { threshold: 3, action: "promote_thread" },
    };

    if (THRESHOLD_ACTIONS[emoji]) {
      const config = THRESHOLD_ACTIONS[emoji];
      const reactionCount = await ctx.db
        .query("reactions")
        .withIndex("by_message_emoji", q =>
          q.eq("messageId", messageId).eq("emoji", emoji)
        )
        .collect();

      // Count unique users
      const uniqueUsers = new Set(reactionCount.map(r => r.userId));
      if (uniqueUsers.size >= config.threshold) {
        await handleThresholdAction(ctx, messageId, config.action);
      }
    }
  },
});
```

### 4.5 Senpai (AI Mascot)

Senpai is an AI presence that lives in the Hangout. It is not a chatbot users interact with directly — it is a passive observer that occasionally contributes.

**Trigger conditions (evaluated on every message in the Hangout):**

1. **Inactivity nudge**: If no messages have been sent in the group for a configurable duration (default: 2 weeks), Senpai posts a nudge like "It's been a while. Anyone up for something?"
2. **"We should..." detection**: If a message matches patterns like "we should", "let's", "someone should", "anyone want to", Senpai suggests creating an Event or Bracket.
3. **Throwback photos**: Periodically (based on frequency setting), Senpai pulls a random old photo from the shared media timeline and posts it.
4. **Game score trash talk**: When a `game_score` message is posted, Senpai might comment on it (e.g., comparing to another member's score).
5. **Milestone celebration**: Tracks group anniversaries, message count milestones, and member join anniversaries.
6. **Inside joke references**: Uses `senpaiMemory` to occasionally reference enshrined Hall of Fame messages or running bits.

**Frequency control**: The `senpaiFrequency` field on the group controls how often Senpai interjects. "Quiet" means only inactivity nudges and milestones. "Normal" adds throwbacks and suggestions. "Chatty" adds game commentary and inside joke references.

**Implementation as a Convex action:**

```typescript
// convex/senpai.ts
export const evaluateAndRespond = internalAction({
  args: {
    groupId: v.id("groups"),
    triggerMessageId: v.optional(v.id("messages")),
    triggerType: v.string(),
  },
  handler: async (ctx, { groupId, triggerMessageId, triggerType }) => {
    const group = await ctx.runQuery(internal.groups.getById, { groupId });
    if (!group.senpaiEnabled) return;

    // Build context from recent messages and memories
    const recentMessages = await ctx.runQuery(
      internal.messages.getRecentForSenpai,
      { groupId, limit: 50 }
    );
    const memories = await ctx.runQuery(
      internal.senpai.getRelevantMemories,
      { groupId, limit: 20 }
    );
    const hallOfFame = await ctx.runQuery(
      internal.hallOfFame.getByGroup,
      { groupId, limit: 10 }
    );

    // Determine if Senpai should respond (based on frequency)
    const shouldRespond = evaluateFrequency(group.senpaiFrequency, triggerType);
    if (!shouldRespond) return;

    // Build the prompt
    const systemPrompt = buildSenpaiPrompt({
      groupName: group.name,
      personality: group.senpaiPersonality,
      memories,
      hallOfFame,
      triggerType,
    });

    // Call AI API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Recent chat:\n${formatMessages(recentMessages)}\n\nTrigger: ${triggerType}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const senpaiMessage = data.content[0].text;

    // Post the message
    const hangoutChannel = await ctx.runQuery(
      internal.channels.getHangout,
      { groupId }
    );

    await ctx.runMutation(internal.messages.postSenpaiMessage, {
      channelId: hangoutChannel._id,
      body: senpaiMessage,
      senpaiTrigger: triggerType,
    });
  },
});
```

**Memory learning**: When a message is enshrined in the Hall of Fame, a separate action extracts the "joke" or "moment" and stores it in `senpaiMemory` as an `inside_joke` type. Over time, Senpai accumulates knowledge of the group's humor and references.

### 4.6 Bill Splitting

Bill splitting is built into Event channels. Multiple splits per event accumulate and net out into a single settlement.

**Flow:**

1. **Receipt upload**: User takes a photo of a receipt or enters items manually. If a photo, the `receiptOcr` action uses Google Cloud Vision to extract line items and amounts, then creates `splitItems` entries.
2. **Item claiming**: Each `splitItem` renders as a tappable card. Users tap to claim items they had. Unclaimed items at settlement time split evenly across all RSVP'd members.
3. **Tax and tip**: After claiming, tax and tip are calculated proportionally based on each person's claimed subtotal.
4. **Net settlement**: The `calculateSettlement` mutation processes all splits for the event, computes net balances (Alice owes Bob $12, Bob owes Carol $8, so Alice owes Carol $4 net), and writes to `splitBalances`.
5. **One-tap pay**: The `VenmoDeepLink` component constructs a `venmo://` deep link with the pre-filled amount and recipient username, opening Venmo with one tap.

**Settlement calculation:**

```typescript
// convex/splits.ts
export const calculateSettlement = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const splits = await ctx.db
      .query("splits")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .collect();

    // Build a ledger: who owes whom how much across ALL splits
    const balances: Record<string, Record<string, number>> = {};

    for (const split of splits) {
      const items = await ctx.db
        .query("splitItems")
        .withIndex("by_split", q => q.eq("splitId", split._id))
        .collect();

      const rsvps = await ctx.db
        .query("eventRsvps")
        .withIndex("by_channel", q => q.eq("channelId", channelId))
        .filter(q => q.eq(q.field("status"), "going"))
        .collect();

      const goingUserIds = rsvps.map(r => r.userId);
      const payer = split.createdBy; // person who paid

      // Calculate each person's share
      const shares: Record<string, number> = {};
      let claimedTotal = 0;

      for (const item of items) {
        if (item.claimedBy && item.claimedBy.length > 0) {
          const perPerson = item.price / item.claimedBy.length;
          for (const userId of item.claimedBy) {
            shares[userId] = (shares[userId] || 0) + perPerson;
          }
          claimedTotal += item.price;
        }
      }

      // Unclaimed items split evenly among all going members
      const unclaimedTotal = split.totalAmount
        - (split.taxAmount || 0)
        - (split.tipAmount || 0)
        - claimedTotal;

      if (unclaimedTotal > 0) {
        const perPerson = unclaimedTotal / goingUserIds.length;
        for (const userId of goingUserIds) {
          shares[userId] = (shares[userId] || 0) + perPerson;
        }
      }

      // Add proportional tax and tip
      const subtotalPerPerson = Object.entries(shares);
      const totalSubtotal = subtotalPerPerson.reduce((sum, [, amt]) => sum + amt, 0);

      for (const [userId, subtotal] of subtotalPerPerson) {
        const proportion = subtotal / totalSubtotal;
        const taxShare = Math.round((split.taxAmount || 0) * proportion);
        const tipShare = Math.round((split.tipAmount || 0) * proportion);
        shares[userId] = subtotal + taxShare + tipShare;
      }

      // Record debts to payer
      for (const [userId, amount] of Object.entries(shares)) {
        if (userId === payer) continue;
        if (!balances[userId]) balances[userId] = {};
        balances[userId][payer] = (balances[userId][payer] || 0) + Math.round(amount);
      }
    }

    // Net out balances and write to splitBalances
    const processed = new Set<string>();
    for (const [fromId, debts] of Object.entries(balances)) {
      for (const [toId, amount] of Object.entries(debts)) {
        const pairKey = [fromId, toId].sort().join("-");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const reverseAmount = balances[toId]?.[fromId] || 0;
        const netAmount = amount - reverseAmount;

        if (netAmount > 0) {
          await ctx.db.insert("splitBalances", {
            splitId: splits[0]._id,
            groupId: (await ctx.db.get(channelId)).groupId,
            fromUserId: fromId as any,
            toUserId: toId as any,
            amount: netAmount,
            isPaid: false,
          });
        } else if (netAmount < 0) {
          await ctx.db.insert("splitBalances", {
            splitId: splits[0]._id,
            groupId: (await ctx.db.get(channelId)).groupId,
            fromUserId: toId as any,
            toUserId: fromId as any,
            amount: Math.abs(netAmount),
            isPaid: false,
          });
        }
      }
    }
  },
});
```

### 4.7 Spotify Integration

**Now Playing**: Members connect their Spotify accounts via OAuth. A Convex cron job (or a client-side interval) polls each connected user's currently playing track every 30 seconds and updates the `nowPlaying` table. The `NowPlayingStrip` component subscribes to `nowPlaying` records for the group and renders a horizontal scrollable row of cards showing each member's current track with album art.

**Shared playlist**: Each channel gets an optional Spotify playlist. When a user reacts with 🎵 on a message containing a Spotify track URL, a Convex action calls the Spotify Web API to add the track to the playlist. The playlist ID is stored on the channel.

**Jam links**: When a user pastes a Spotify Jam link, the `MessageBubble` component detects the URL pattern and renders a rich card with the Jam title and a "Join" button that deep-links into Spotify.

### 4.8 Daily Games Leaderboard

**Score detection**: When a message is sent, the `messages.send` mutation checks the body against regex patterns for Wordle, Connections, and NYT Mini results. If a match is found, it parses the score and creates a `gameScores` entry, and the message type is set to `game_score`.

**Parsing examples:**

```typescript
// convex/lib/gameParser.ts
export function parseGameScore(text: string): GameScore | null {
  // Wordle: "Wordle 1,234 3/6" or "Wordle 1,234 X/6"
  const wordleMatch = text.match(/Wordle\s+([\d,]+)\s+([X\d])\/6/);
  if (wordleMatch) {
    return {
      game: "wordle",
      score: wordleMatch[2] === "X" ? 7 : parseInt(wordleMatch[2]),
      attempts: parseInt(wordleMatch[2] === "X" ? "7" : wordleMatch[2]),
      date: new Date().toISOString().split("T")[0],
      rawText: text,
    };
  }

  // Connections: "Connections Puzzle #123" with colored squares
  const connectionsMatch = text.match(/Connections\s+Puzzle\s+#(\d+)/);
  if (connectionsMatch) {
    const mistakes = (text.match(/🟪|🟦|🟩|🟨/g) || []).length;
    return {
      game: "connections",
      score: Math.max(0, 4 - countMistakes(text)),
      date: new Date().toISOString().split("T")[0],
      rawText: text,
    };
  }

  // Mini crossword: time-based
  const miniMatch = text.match(/Mini.*?(\d+):(\d+)/);
  if (miniMatch) {
    const seconds = parseInt(miniMatch[1]) * 60 + parseInt(miniMatch[2]);
    return {
      game: "mini",
      score: seconds,
      date: new Date().toISOString().split("T")[0],
      rawText: text,
    };
  }

  return null;
}
```

**Leaderboard queries**: The `DailyLeaderboard` component queries `gameScores` by group, game, and today's date to show today's results. `StreakTracker` queries by user and game to calculate consecutive days played. `HeadToHead` compares two users' running averages.

### 4.9 Hall of Fame

When a message accumulates 5+ 🏆 reactions from unique users, the threshold action fires and creates a `hallOfFame` entry. The message body is snapshotted into the record so it persists even if the original message is edited.

The `HallOfFameGallery` component renders enshrined messages in a card grid with the original author's avatar, the message text, the date, and the trophy count. New members can scroll through it to absorb the group's culture.

When a message is enshrined, a Convex action fires to extract the "joke" or "moment" into `senpaiMemory`, so Senpai can reference it later.

### 4.10 Mobile-Native Threading

Threading follows an iMessage-inspired pattern:

1. The main `MessageFeed` renders top-level messages only (where `threadParentId` is null).
2. Messages with replies show a `ThreadChip` component beneath them: "3 replies · Last from Jake 2m ago."
3. Tapping the chip opens the `ThreadBottomSheet`, a Framer Motion animated bottom sheet that slides up and shows the full thread conversation with its own `MessageComposer`.
4. The user never navigates away from the main feed — the thread overlays it.

**Implementation approach**: The bottom sheet is a fixed-position overlay with `drag` constraints from Framer Motion. It renders the thread messages using a paginated query filtered by `threadParentId`. The main feed remains scrollable beneath it (with a dimmed backdrop).

### 4.11 Shared Media Timeline

The `media` page queries all messages across all channels in the group that have `mediaStorageIds`, ordered by `createdAt` descending. It renders them in a masonry grid with lazy loading. Tapping opens a lightbox with the full image/video and a link to the original message context.

This gallery grows richer the longer the group uses the app, creating an organic photo archive of group memories.

---

## 5. Real-Time & Presence

### 5.1 Presence System

The `presence` table tracks each user's online status per group. The client sends a heartbeat mutation every 30 seconds while the app is in the foreground, updating `lastSeenAt` and `status` to "online." When the heartbeat stops (user backgrounds the app), a Convex scheduled function transitions the status to "idle" after 2 minutes and "offline" after 5 minutes.

```typescript
// convex/presence.ts
export const heartbeat = mutation({
  args: { groupId: v.id("groups"), channelId: v.optional(v.id("channels")) },
  handler: async (ctx, { groupId, channelId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUserByClerkId(ctx, identity!.subject);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_group", q =>
        q.eq("userId", user._id).eq("groupId", groupId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "online",
        channelId,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("presence", {
        userId: user._id,
        groupId,
        channelId,
        status: "online",
        lastSeenAt: now,
      });
    }

    // Also update lastActiveAt on groupMembers for watercooler logic
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", q =>
        q.eq("groupId", groupId).eq("userId", user._id)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, { lastActiveAt: now });
    }
  },
});
```

### 5.2 Real-Time Message Delivery

Convex handles real-time sync natively. The `MessageFeed` component uses `usePaginatedQuery` to load messages, and Convex automatically pushes new messages to all connected clients via WebSocket. No polling is needed.

```typescript
// Client component
const { results, status, loadMore } = usePaginatedQuery(
  api.messages.listByChannel,
  { channelId },
  { initialNumItems: 50 }
);
```

---

## 6. Frontend Component Specifications

### 6.1 Design System

**Color palette** (derived from the pitch deck's warm, dark aesthetic):

```css
/* src/styles/globals.css */
:root {
  --bg-primary: #1a1210;        /* deep warm black */
  --bg-secondary: #231c18;      /* slightly lighter */
  --bg-surface: #2d2420;        /* card backgrounds */
  --bg-elevated: #3a302a;       /* modals, sheets */

  --text-primary: #f5efe8;      /* warm off-white */
  --text-secondary: #a89888;    /* muted text */
  --text-tertiary: #6b5e52;     /* very muted */

  --accent-hangout: #7ec8a4;    /* teal-green */
  --accent-event: #e8a66a;      /* warm amber */
  --accent-bracket: #c49ae0;    /* soft purple */
  --accent-senpai: #e88aa0;     /* pink */
  --accent-action: #e87654;     /* red-orange for CTAs */

  --border: #3a302a;
  --border-focus: #e8a66a;

  --fire-glow: #ff6b35;
  --trophy-gold: #ffd700;
}
```

**Typography**:

```typescript
// tailwind.config.ts
fontFamily: {
  display: ['"Playfair Display"', 'serif'],  // headlines, channel names
  body: ['"DM Sans"', 'sans-serif'],         // message text, UI
  mono: ['"JetBrains Mono"', 'monospace'],   // scores, code
}
```

### 6.2 Key Component Behaviors

**MessageBubble**: Renders differently based on `messageType`. System messages are centered and muted. Senpai messages have a distinct pink-bordered style with the Senpai avatar. Game scores render as formatted cards with the game grid. Bracket results show the winner with a trophy animation. Regular messages show the author's avatar, name, timestamp, body, media, link preview, reactions, and thread chip.

**ChannelSidebar**: Groups channels by type with colored section headers (Hangout in teal, Events in amber, Brackets in purple). Active events show a countdown badge. Archived channels are collapsed under a toggle. Unread indicators show on channels with new messages. The sidebar is a slide-out drawer on mobile, persistent on desktop.

**BracketView**: Renders the tournament bracket as a tree of matchup cards flowing left to right. Uses CSS Grid with `grid-template-columns` for each round. Active matchups pulse with a glow border. Completed matchups show the winner highlighted. The final winner card is oversized with the accent-bracket color. Animated transitions when a matchup resolves using Framer Motion's `layout` prop.

---

## 7. API Design (Convex Functions)

### 7.1 Query Functions

| Function | Arguments | Returns | Description |
|---|---|---|---|
| `users.me` | — | `User` | Current authenticated user |
| `groups.list` | — | `Group[]` | All groups the user belongs to |
| `groups.getById` | `groupId` | `Group` with members | Single group with member list |
| `channels.listByGroup` | `groupId` | `Channel[]` | All channels for a group, sorted by type |
| `messages.listByChannel` | `channelId` | Paginated `Message[]` | Top-level messages, newest first |
| `messages.listThread` | `parentMessageId` | `Message[]` | Thread replies for a message |
| `reactions.getByMessage` | `messageId` | Grouped reactions | Reactions grouped by emoji with user lists |
| `brackets.getMatchups` | `channelId` | `BracketMatchup[]` | All matchups with vote counts |
| `events.getRsvps` | `channelId` | `EventRsvp[]` | RSVP statuses for an event |
| `events.getChecklist` | `channelId` | `ChecklistItem[]` | Checklist items for an event |
| `splits.getByChannel` | `channelId` | `Split[]` with items | All splits for an event |
| `splits.getBalances` | `groupId` | `SplitBalance[]` | Net balances across all events |
| `hallOfFame.getByGroup` | `groupId` | `HallOfFame[]` | All enshrined messages |
| `dailyGames.leaderboard` | `groupId, game, date` | `GameScore[]` | Today's scores for a game |
| `dailyGames.stats` | `groupId, userId, game` | Stats object | Average, streak, best for a user |
| `presence.getByGroup` | `groupId` | `Presence[]` | Online status for all members |
| `nowPlaying.getByGroup` | `groupId` | `NowPlaying[]` | Currently playing tracks |
| `media.getTimeline` | `groupId` | Paginated media items | All media across channels |
| `notifications.getUnread` | — | `Notification[]` | Unread notifications |

### 7.2 Mutation Functions

| Function | Arguments | Description |
|---|---|---|
| `messages.send` | `channelId, body, mediaIds?, threadParentId?` | Send a message (also triggers game parsing and Senpai evaluation) |
| `messages.edit` | `messageId, body` | Edit a message |
| `messages.delete` | `messageId` | Soft-delete a message |
| `reactions.add` | `messageId, emoji` | Add reaction (triggers emoji actions) |
| `reactions.remove` | `messageId, emoji` | Remove a reaction |
| `channels.create` | `groupId, name, type, ...typeSpecificFields` | Create a channel |
| `channels.forkFromMessage` | `messageId, type, name, ...` | Fork a message into a new channel |
| `threads.promoteToFork` | `parentMessageId, channelName` | Promote a thread to a fork |
| `brackets.addEntry` | `channelId, name` | Nominate an option |
| `brackets.lockAndGenerate` | `channelId` | Lock nominations and generate matchups |
| `brackets.castVote` | `matchupId, vote` | Vote in a matchup |
| `events.setRsvp` | `channelId, status` | Set RSVP status |
| `events.addChecklistItem` | `channelId, item` | Add a checklist item |
| `events.claimChecklistItem` | `itemId` | Claim a checklist item |
| `splits.create` | `channelId, name, totalAmount, ...` | Create a bill split |
| `splits.claimItem` | `itemId` | Claim a split item |
| `splits.calculateSettlement` | `channelId` | Calculate net balances |
| `splits.markPaid` | `balanceId` | Mark a balance as paid |
| `groups.create` | `name` | Create a group |
| `groups.join` | `inviteCode` | Join via invite code |
| `groups.updateSenpaiSettings` | `groupId, enabled, frequency, personality` | Configure Senpai |
| `presence.heartbeat` | `groupId, channelId?` | Update presence |
| `notifications.markRead` | `notificationId` | Mark notification as read |

### 7.3 Action Functions (External API Calls)

| Function | Description |
|---|---|
| `senpai.evaluateAndRespond` | Call AI API to generate Senpai response |
| `senpai.extractMemory` | Extract inside jokes from Hall of Fame entries |
| `spotify.refreshNowPlaying` | Poll Spotify API for current track |
| `spotify.addToPlaylist` | Add track to shared playlist via Spotify API |
| `splits.ocrReceipt` | Send receipt image to OCR API, parse items |
| `notifications.sendPush` | Send push notification via Expo/Web Push |

---

## 8. Authentication & Authorization

### 8.1 Authentication (Clerk)

Clerk handles user authentication with support for email, phone, Google, and Apple sign-in. The Convex-Clerk integration syncs user data to the `users` table via a webhook.

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

### 8.2 Authorization Rules

All mutations and queries check group membership before returning data or making changes. The `permissions.ts` utility provides reusable checks:

```typescript
// convex/lib/permissions.ts
export async function assertGroupMember(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", q =>
      q.eq("groupId", groupId).eq("userId", userId)
    )
    .first();

  if (!membership) throw new Error("Not a member of this group");
  return membership;
}

export async function assertGroupAdmin(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  const membership = await assertGroupMember(ctx, groupId, userId);
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Admin access required");
  }
  return membership;
}
```

---

## 9. Notification Strategy

### 9.1 Notification Types and Priority

| Type | Priority | Sound | Badge | Condition |
|---|---|---|---|---|
| Direct mention (@name) | High | Yes | Yes | Always |
| Message in event | High | Yes | Yes | Always |
| Bracket vote needed | High | Yes | Yes | When matchup becomes active |
| Split request | Medium | Yes | Yes | When split is created |
| Hall of Fame enshrinement | Medium | No | Yes | When threshold is met |
| Hangout message | Low | Optional | Yes | Only if recently active (watercooler) |
| Senpai message | Low | No | No | Never pushes |

### 9.2 Watercooler Logic

The Hangout uses "watercooler" notification logic: push notifications are only sent to members who have been active in the group within the last 48 hours (configurable). This prevents the always-on channel from becoming noisy for members who have been away. When they open the app, they see the messages — but they aren't pinged for every one.

---

## 10. Performance Considerations

### 10.1 Message Loading

Messages use Convex's `usePaginatedQuery` with an initial load of 50 messages and infinite scroll loading 25 more at a time. The `MessageFeed` uses `react-virtuoso` for virtualized rendering, keeping DOM node count low even in channels with thousands of messages.

### 10.2 Indexes

Every query is backed by an index (as defined in the schema). Convex requires explicit indexes for every `withIndex` call, so all access patterns are covered. The `search_body` search index on messages enables full-text search across archived channels.

### 10.3 Denormalization

Thread reply counts are denormalized on the parent message (`threadReplyCount`, `threadLastReplyAt`) to avoid counting queries. Reaction counts for threshold checking use the indexed query on `by_message_emoji`. Hall of Fame trophy counts are snapshotted in the `hallOfFame` record.

### 10.4 File Handling

Images and receipts go through Convex file storage, which provides automatic CDN-backed URLs. Thumbnails should be generated on upload via a Convex action that resizes the image before storing.

---

## 11. Testing Strategy

| Layer | Tool | What to Test |
|---|---|---|
| Convex functions | Convex test harness | Bracket generation correctness, split calculation accuracy, threshold action triggers, game score parsing |
| React components | Vitest + React Testing Library | Message rendering by type, emoji action dispatch, thread expansion, bracket voting UI states |
| Integration | Playwright | Full flows: send message → react → fork → bracket → vote → winner posts back |
| AI (Senpai) | Manual + prompt regression | Senpai tone consistency, memory recall accuracy, appropriate silence |

---

## 12. Deployment

| Concern | Approach |
|---|---|
| Frontend hosting | Vercel (Next.js native support) |
| Backend | Convex Cloud (managed) |
| Auth | Clerk Cloud |
| Environment variables | Vercel env vars for `CONVEX_DEPLOYMENT`, `CLERK_*` keys; Convex dashboard for `ANTHROPIC_API_KEY`, `SPOTIFY_CLIENT_SECRET`, `GOOGLE_VISION_API_KEY` |
| CI/CD | GitHub Actions running `npx convex deploy` on merge to main, Vercel auto-deploys frontend |
| Monitoring | Convex dashboard for function logs and errors; Sentry for frontend errors |

---

## 13. Migration & Launch Plan

**Phase 1 — Core messaging (Weeks 1–4)**: Groups, users, Hangout channel, basic messaging, threads, reactions (cosmetic only), presence.

**Phase 2 — Channel types (Weeks 5–8)**: Events with RSVP and checklists, Brackets with voting, forking mechanic, emoji actions (instant + threshold).

**Phase 3 — Integrations (Weeks 9–12)**: Spotify Now Playing and playlists, daily games leaderboard, bill splitting with OCR, Hall of Fame.

**Phase 4 — Senpai (Weeks 13–16)**: AI mascot with all trigger types, memory system, personality tuning, frequency controls.

**Phase 5 — Polish (Weeks 17–20)**: Shared media timeline, mobile optimization, push notifications, onboarding flow, performance tuning, beta testing.
