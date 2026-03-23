# my-helpdesk

A fully free, personal helpdesk ticketing system built with Next.js 15, Supabase, Gmail SMTP, and @dnd-kit.

**Live:** https://ohms-help-desk.vercel.app

## Stack

| Layer      | Tool                    | Cost  |
|------------|-------------------------|-------|
| Framework  | Next.js 15 (App Router) | Free  |
| Database   | Supabase (free tier)    | Free  |
| Auth       | Supabase + GitHub OAuth | Free  |
| Email      | Gmail SMTP + Nodemailer | Free  |
| Hosting    | Vercel (free tier)      | Free  |
| Drag/Drop  | @dnd-kit                | Free  |
| Code host  | Personal GitHub repo    | Free  |

**Total monthly cost: $0**

---

## Features

- Public ticket submission form (anyone with the URL can submit)
- Email confirmation sent to submitter with a unique tracking link
- Ticket tracking page — submitter checks status without login
- Admin dashboard with search + filters (status, priority, category)
- Ticket detail — update status/priority, send replies
- Kanban board with drag-and-drop (Open → In Progress → Resolved → Closed)
- Email notifications on status change and admin reply
- GitHub OAuth login for the admin panel
- Admin whitelist — only approved emails can access the admin panel
- Access denied page for unauthorized login attempts

---

## Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/my-helpdesk.git
cd my-helpdesk
npm install
```

### 2. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) → create a free account → New Project
2. Once created, go to **SQL Editor** → paste and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Enable GitHub OAuth in Supabase

1. In Supabase → **Authentication → Providers → GitHub** → Enable
2. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**:
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `https://<your-project>.supabase.co/auth/v1/callback`
3. Copy **Client ID** and generate a **Client Secret** → paste both into Supabase

### 4. Set up Gmail App Password (free email, no domain needed)

1. Go to **https://myaccount.google.com/security** → enable **2-Step Verification** if not already on
2. Go to **https://myaccount.google.com/apppasswords**
3. App name: `my-helpdesk` → click **Create**
4. Copy the 16-character password — shown only once

### 5. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=your_gmail@gmail.com
ADMIN_EMAILS=your_gmail@gmail.com
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route                     | Who can access | Description                          |
|---------------------------|----------------|--------------------------------------|
| `/`                       | Anyone         | Public ticket submission form        |
| `/track`                  | Anyone         | Enter tracking token                 |
| `/track/[token]`          | Anyone         | View ticket status + activity        |
| `/login`                  | Anyone         | Admin login via GitHub OAuth         |
| `/unauthorized`           | Anyone         | Access denied page (non-whitelisted) |
| `/admin`                  | Admin only     | Ticket list with search + filters    |
| `/admin/tickets/[id]`     | Admin only     | Ticket detail, replies, status       |
| `/admin/kanban`           | Admin only     | Drag-and-drop Kanban board           |

---

## Deploy to Vercel (free)

1. Push this repo to your personal GitHub account
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Add all environment variables from `.env.local` to Vercel
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Deploy

After first deploy:
- Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your live URL → redeploy
- Add `ADMIN_EMAILS` to Vercel env vars (comma-separated list of allowed admin GitHub emails)
- Add your Vercel URL to Supabase → **Authentication → URL Configuration → Redirect URLs**
- Update your GitHub OAuth App **Homepage URL** to your Vercel URL

To add or remove admins later — see `docs/ADMIN_MANAGEMENT.md`

---

## Project Structure

```
src/
  app/
    page.tsx                     # Home — public submission form
    layout.tsx                   # Root layout
    login/page.tsx               # Admin login (GitHub OAuth)
    track/
      page.tsx                   # Tracking token entry page
      [token]/page.tsx           # Ticket status + activity
    unauthorized/
      page.tsx                   # Access denied page for non-whitelisted users
    admin/
      layout.tsx                 # Admin shell + auth guard + ADMIN_EMAILS whitelist
      page.tsx                   # Ticket list (server component)
      kanban/page.tsx            # Kanban board
      tickets/[id]/page.tsx      # Ticket detail (server component)
    api/
      auth/login/route.ts        # POST → GitHub OAuth redirect
      auth/callback/route.ts     # GET → OAuth callback handler
      auth/logout/route.ts       # POST → sign out
    actions/
      tickets.ts                 # Server Actions (create, update, reply)
  components/
    forms/TicketForm.tsx         # Public submission form (client)
    admin/
      TicketList.tsx             # Filterable ticket table (client)
      TicketDetail.tsx           # Detail + reply view (client)
      KanbanBoard.tsx            # Drag-and-drop Kanban (client)
  lib/
    utils.ts                     # cn(), formatDate(), formatDateShort()
    email.ts                     # Gmail SMTP email functions (nodemailer)
    supabase/
      client.ts                  # Browser Supabase client
      server.ts                  # Server Supabase client + service client
      middleware.ts              # Session refresh helper
  types/
    index.ts                     # TypeScript types + label/color maps
  middleware.ts                  # Route protection (admin guard)
supabase/
  schema.sql                     # Run this once in Supabase SQL Editor
.env.example                     # Environment variable template
```
