# Architecture — my-helpdesk

Technical reference for the entire project — stack decisions, data model, routing, and file responsibilities.

**Live URL:** https://ohms-help-desk.vercel.app  
**GitHub:** https://github.com/Tech-Ohmer/Ohms_HelpDesk  
**Last updated:** March 2026

---

## Stack Overview

| Layer | Technology | Version | Why chosen |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2 (Next 15) | Full-stack in one repo, Server Actions, no separate backend needed |
| Language | TypeScript | 5.x | Type safety across the whole project |
| Database | Supabase (PostgreSQL) | Latest | Free tier, real-time, built-in auth, Row Level Security |
| Auth | Supabase Auth + GitHub OAuth | Latest | Free, no extra service, integrates with Supabase session management |
| Email | Gmail SMTP + Nodemailer | Latest | Completely free, no domain needed, sends to any recipient |
| Drag and Drop | @dnd-kit/core + sortable | 6.x / 10.x | Actively maintained, accessible, works with React 19 + Next.js 15 |
| Styling | Tailwind CSS | 4.x | Utility-first, included in create-next-app scaffold |
| Hosting | Vercel | Latest | Free tier, native Next.js support, auto-deploys from GitHub |

### Tools considered but not chosen

| Tool | Reason not chosen |
|---|---|
| react-beautiful-dnd | Abandoned by Atlassian, not maintained, breaks with React 18+ |
| shadcn/ui | Extra setup complexity for this project size; plain Tailwind is sufficient |
| Prisma / Drizzle | Supabase client already handles DB access; ORM adds unnecessary complexity |
| NextAuth.js | Supabase Auth handles OAuth natively; no need for a second auth library |
| Resend | Free tier restricts sending to only the signup email. Replaced with Gmail SMTP. |
| Firebase | Vendor lock-in, pricing model complexity |
| PlanetScale | Requires schema migration workflow; Supabase SQL editor is simpler for solo use |

### Email provider decision: Resend → Gmail SMTP

Initially planned to use Resend. During testing, discovered that Resend's free plan only allows sending to the email address used to sign up — not to arbitrary recipients. This makes it unsuitable for a helpdesk (users submit tickets with their own email addresses).

Replaced with **Nodemailer + Gmail SMTP**:
- Uses your own Gmail account as the sender
- Gmail App Password for authentication (not your real password)
- Sends to any email address, no restrictions
- 500 emails/day free limit
- Zero cost, zero domain required

### Known Bugs Fixed

| Bug | Root Cause | Fix |
|---|---|---|
| GitHub OAuth → 405 | Login route used HTTP 307 redirect (preserves POST method). Supabase authorize endpoint only accepts GET. | Changed to HTTP 303 (See Other) which always switches to GET. |
| Resend emails not sending | Resend free tier restricts recipients to signup email only. | Replaced Resend with Gmail SMTP via nodemailer. |
| `.env.local` not loading | File was named `.env` instead of `.env.local`. | Renamed correctly. |
| Supabase 405 on authorize | `localhost:3000` not in Supabase allowed redirect URLs. | Added localhost URLs to Supabase URL Configuration. |

---

## Data Model

### `tickets` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated unique identifier |
| `ticket_number` | TEXT (UNIQUE) | Human-readable ID: TKT-0001, TKT-0002... (auto-generated via trigger) |
| `submitter_name` | TEXT | Full name of the person who submitted |
| `submitter_email` | TEXT | Email address — used for notifications |
| `title` | TEXT | Subject / short description |
| `description` | TEXT | Full description of the issue |
| `category` | TEXT | One of: `bug`, `feature_request`, `question`, `other` |
| `priority` | TEXT | One of: `low`, `medium`, `high`, `urgent` |
| `status` | TEXT | One of: `open`, `in_progress`, `resolved`, `closed` (default: `open`) |
| `tracking_token` | TEXT (UNIQUE) | 16-character random token used in the public tracking URL |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated on every row change via trigger |

### `ticket_updates` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated unique identifier |
| `ticket_id` | UUID (FK → tickets.id) | Which ticket this update belongs to |
| `message` | TEXT | The reply or activity message content |
| `is_admin_reply` | BOOLEAN | `true` = sent by admin, `false` = submitter activity |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

### Database Triggers

- **`set_ticket_number`** — fires `BEFORE INSERT` on tickets, generates the next `TKT-XXXX` number from a sequence
- **`tickets_updated_at`** — fires `BEFORE UPDATE` on tickets, sets `updated_at = now()`

### Row Level Security Policies

| Table | Operation | Policy |
|---|---|---|
| tickets | INSERT | Anyone (public form) |
| tickets | SELECT | Anyone (tracking token check happens in application layer) |
| tickets | UPDATE | Authenticated users only (admin) |
| ticket_updates | INSERT | Anyone |
| ticket_updates | SELECT | Anyone |

> All admin operations use the **service role key** which bypasses RLS entirely. RLS policies serve as a safety net for anon key operations.

---

## Authentication Flow

```
User visits /admin
       ↓
middleware.ts checks Supabase session
       ↓
No session → redirect to /login
       ↓
User clicks "Continue with GitHub"
       ↓
POST /api/auth/login
       ↓
Supabase generates GitHub OAuth URL
       ↓
Browser redirects to GitHub → user authorizes
       ↓
GitHub redirects to Supabase callback
       ↓
Supabase redirects to GET /api/auth/callback?code=xxx
       ↓
Server exchanges code for session (stored in cookie)
       ↓
Redirect to /admin ✓
```

Session is stored in an HTTP-only cookie managed by `@supabase/ssr`.  
The `middleware.ts` file refreshes the session on every request and protects all `/admin/*` routes.

---

## Email Notification Flow

Three emails are sent automatically:

### 1. Ticket Created
**Trigger:** Submitter submits the form  
**Recipients:** Submitter (confirmation + tracking link) + Admin (new ticket alert)  
**File:** `src/lib/email.ts` → `sendTicketCreatedEmail()`  
**Action:** `src/app/actions/tickets.ts` → `createTicket()`

### 2. Status Updated
**Trigger:** Admin changes ticket status in detail view or Kanban board  
**Recipient:** Submitter  
**File:** `src/lib/email.ts` → `sendStatusUpdateEmail()`  
**Action:** `src/app/actions/tickets.ts` → `updateTicketStatus()`

### 3. Admin Reply
**Trigger:** Admin submits a reply in the ticket detail view  
**Recipient:** Submitter  
**File:** `src/lib/email.ts` → `sendAdminReplyEmail()`  
**Action:** `src/app/actions/tickets.ts` → `addAdminReply()`

All emails are sent via Resend using the `onboarding@resend.dev` sender address (free tier, no domain verification needed).

---

## Routing Map

### Public routes (no login required)

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Ticket submission form |
| `/track` | `src/app/track/page.tsx` | Enter tracking token manually |
| `/track/[token]` | `src/app/track/[token]/page.tsx` | Ticket status + activity + progress stepper |
| `/login` | `src/app/login/page.tsx` | Admin login page (GitHub OAuth button) |

### Admin routes (requires GitHub login)

| Route | File | Description |
|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | All tickets — searchable, filterable table |
| `/admin/kanban` | `src/app/admin/kanban/page.tsx` | Drag-and-drop Kanban board |
| `/admin/tickets/[id]` | `src/app/admin/tickets/[id]/page.tsx` | Ticket detail, replies, status/priority |

### API routes

| Route | Method | File | Description |
|---|---|---|---|
| `/api/auth/login` | POST | `src/app/api/auth/login/route.ts` | Starts GitHub OAuth flow |
| `/api/auth/callback` | GET | `src/app/api/auth/callback/route.ts` | Handles OAuth callback, sets session |
| `/api/auth/logout` | POST | `src/app/api/auth/logout/route.ts` | Signs out, clears session |

---

## File Responsibilities

```
C:\Users\OhmerSulit\Projects\helpdesk\
│
├── src/
│   ├── middleware.ts
│   │     Guards /admin/* routes — redirects to /login if no session
│   │
│   ├── types/
│   │   └── index.ts
│   │         TypeScript types: Ticket, TicketUpdate, TicketWithUpdates
│   │         Enums: TicketStatus, TicketPriority, TicketCategory
│   │         Display maps: TICKET_STATUS_LABELS, TICKET_PRIORITY_COLORS, etc.
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   │     cn() — merges Tailwind classes (clsx + tailwind-merge)
│   │   │     formatDate() — full date + time display
│   │   │     formatDateShort() — date only display
│   │   │
│   │   ├── email.ts
│   │   │     sendTicketCreatedEmail() — confirmation to submitter + alert to admin
│   │   │     sendStatusUpdateEmail() — notifies submitter of status change
│   │   │     sendAdminReplyEmail() — notifies submitter of a new reply
│   │   │
│   │   └── supabase/
│   │       ├── client.ts     — Browser Supabase client (anon key)
│   │       ├── server.ts     — Server Supabase client (anon key) + createServiceClient() (service role key)
│   │       └── middleware.ts — updateSession() used by src/middleware.ts to refresh cookies
│   │
│   ├── app/
│   │   ├── layout.tsx           — Root HTML shell, sets metadata
│   │   ├── globals.css          — Tailwind v4 import
│   │   ├── page.tsx             — Home page — renders <TicketForm>
│   │   │
│   │   ├── actions/
│   │   │   └── tickets.ts
│   │   │         createTicket()           — inserts ticket, sends emails, returns tracking token
│   │   │         updateTicketStatus()     — updates status, sends notification email
│   │   │         updateTicketPriority()   — updates priority only
│   │   │         addAdminReply()          — inserts ticket_update, sends reply email
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx         — Shows GitHub login button; redirects to /admin if already logged in
│   │   │
│   │   ├── track/
│   │   │   ├── page.tsx         — Token entry form (client component)
│   │   │   └── [token]/
│   │   │       └── page.tsx     — Fetches ticket by token, shows status + activity + progress stepper
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx       — Nav bar + auth guard (redirects if no session)
│   │   │   ├── page.tsx         — Fetches all tickets (server), renders <AdminTicketList>
│   │   │   ├── kanban/
│   │   │   │   └── page.tsx     — Fetches non-closed tickets (server), renders <KanbanBoard>
│   │   │   └── tickets/
│   │   │       └── [id]/
│   │   │           └── page.tsx — Fetches ticket + updates (server), renders <AdminTicketDetail>
│   │   │
│   │   └── api/
│   │       └── auth/
│   │           ├── login/
│   │           │   └── route.ts     — POST → generates GitHub OAuth URL → redirects
│   │           ├── callback/
│   │           │   └── route.ts     — GET → exchanges code for session → redirects to /admin
│   │           └── logout/
│   │               └── route.ts     — POST → signs out → redirects to /login
│   │
│   └── components/
│       ├── forms/
│       │   └── TicketForm.tsx
│       │         Client component. Native HTML form (no react-hook-form).
│       │         Calls createTicket() Server Action on submit.
│       │         Redirects to /track/[token] on success.
│       │
│       └── admin/
│           ├── TicketList.tsx
│           │     Client component. Receives all tickets as props from server component.
│           │     Local state for: search, statusFilter, priorityFilter, categoryFilter.
│           │     Filters tickets client-side (no re-fetch needed).
│           │     Renders a responsive table with links to ticket detail pages.
│           │
│           ├── TicketDetail.tsx
│           │     Client component. Receives ticket + updates as props.
│           │     Handles status change, priority change, and admin reply via Server Actions.
│           │     Uses router.refresh() to re-fetch server data after mutations.
│           │     Shows reply thread with visual distinction (admin vs submitter).
│           │
│           └── KanbanBoard.tsx
│                 Client component. Receives tickets as props, manages local state.
│                 Uses @dnd-kit/core (DndContext) and @dnd-kit/sortable (SortableContext, useSortable).
│                 Four columns: Open, In Progress, Resolved, Closed.
│                 On drag end: optimistic UI update → calls updateTicketStatus() → reverts on failure.
│                 DragOverlay renders a floating card while dragging.
│
├── supabase/
│   └── schema.sql               — Full database schema, run once in Supabase SQL Editor
│
├── docs/                        — This documentation folder
│   ├── SETUP_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── CONVERSATION_LOG.md
│   └── TROUBLESHOOTING.md
│
├── .env.example                 — Template for environment variables
├── .env.local                   — Your actual secrets (gitignored, never committed)
├── README.md                    — Quick-start overview
├── package.json                 — Dependencies and scripts
├── tsconfig.json                — TypeScript config
├── next.config.ts               — Next.js config
└── postcss.config.mjs           — Tailwind v4 PostCSS config
```

---

## Key Design Decisions

### Server Components vs Client Components

Most data fetching happens in **Server Components** (pages). They use `createServiceClient()` (service role key) to read directly from Supabase.

Client Components (`TicketList`, `TicketDetail`, `KanbanBoard`, `TicketForm`) handle interactivity only. They receive data as props from their parent server components.

Mutations always go through **Server Actions** (`src/app/actions/tickets.ts`) — never client-side fetch calls. This keeps secrets on the server.

### Why service role key and not anon key for reads?

The anon key + RLS policies would technically work for reads, but using the service role key on the server simplifies the RLS rules, eliminates edge cases, and makes intent explicit: all server-side code is trusted, all client-side code is sandboxed.

### Tracking tokens

Each ticket gets a `nanoid(16)` token (16 random characters from a URL-safe alphabet). This produces 2^80+ possible values — effectively impossible to guess. No auth is needed for the tracking page because the token itself is the secret.

### Optimistic UI in Kanban

When a card is dragged to a new column, the UI updates immediately without waiting for the server. If `updateTicketStatus()` fails, the card snaps back to its original column. This makes the board feel instant while maintaining data integrity.
