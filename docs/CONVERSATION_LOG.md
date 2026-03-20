# Conversation Log — my-helpdesk

A full record of all conversations that produced and deployed this project.

**Owner:** Ohmer Sulit (personal project — not related to HelloFresh or Helloconnect)  
**GitHub:** https://github.com/Tech-Ohmer/Ohms_HelpDesk  
**Live URL:** https://ohms-help-desk.vercel.app

---

# Session 1 — Planning and Build

**Date:** Friday, March 20, 2026  
**Participants:** Ohmer Sulit + OpenCode (AI agent)

---

## 1. Initial Question

**Ohmer asked:**
> "If I want to create a totally free ticketing system or helpdesk system, is it possible to use GitHub etc. to make it totally free?"

**Context established:**
- Personal use only, not related to HelloFresh or Helloconnect
- Must use personal accounts (Gmail, personal GitHub)
- Must be completely free

---

## 2. Requirements Gathered

| Question | Answer |
|---|---|
| Who submits tickets? | Anyone via a public form |
| Build complexity? | Full web app |
| Must-have features? | Email notifications, status tracking, priority levels, categories, submitter tracking portal, kanban board |
| Purpose? | Learning project |

---

## 3. Stack Decision

| Layer | Tool | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack in one, free on Vercel |
| Database | Supabase (free tier) | PostgreSQL + Auth + real-time |
| Auth | Supabase Auth + GitHub OAuth | Personal GitHub, no extra service |
| Email | Gmail SMTP + Nodemailer | See Session 2 — Resend replaced |
| Hosting | Vercel (free tier) | Best Next.js host, auto-deploys |
| Code | Personal GitHub repo | Free private/public repo |
| Styles | Tailwind CSS | Included in scaffold |

---

## 4. Drag-and-Drop Decision

**Question:** `@dnd-kit` vs `react-beautiful-dnd`?

**Decision: `@dnd-kit`**

Reasons:
- Actively maintained (react-beautiful-dnd is abandoned by Atlassian)
- Accessible by default (ARIA + keyboard support)
- Works with React 18/19 and Next.js App Router
- Better performance, production-grade

---

## 5. Project Location and Name

- **Local folder:** `C:\Users\OhmerSulit\Projects\helpdesk`
- **Project name:** `my-helpdesk`
- **GitHub repo:** `https://github.com/Tech-Ohmer/Ohms_HelpDesk`
- **Vercel URL:** `https://ohms-help-desk.vercel.app`

**Confirmed:** Completely separate from HelloFresh/FusionKitchen. No Jira tickets, no FK conventions, no HelloFresh GitHub org.

---

## 6. Files Built

### Source files (24)

| File | Purpose |
|---|---|
| `src/types/index.ts` | TypeScript types and display maps |
| `src/lib/utils.ts` | cn(), formatDate(), formatDateShort() |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server + service role clients |
| `src/lib/supabase/middleware.ts` | Session refresh helper |
| `src/lib/email.ts` | Gmail SMTP email functions (nodemailer) |
| `src/middleware.ts` | Route protection |
| `src/app/layout.tsx` | Root HTML layout |
| `src/app/globals.css` | Tailwind v4 import |
| `src/app/page.tsx` | Home — public submission form |
| `src/app/actions/tickets.ts` | Server Actions (create, update, reply) |
| `src/app/login/page.tsx` | Admin login page |
| `src/app/track/page.tsx` | Tracking token entry |
| `src/app/track/[token]/page.tsx` | Ticket status + progress stepper |
| `src/app/admin/layout.tsx` | Admin nav + auth guard |
| `src/app/admin/page.tsx` | Admin ticket list (server) |
| `src/app/admin/kanban/page.tsx` | Kanban page |
| `src/app/admin/tickets/[id]/page.tsx` | Ticket detail (server) |
| `src/app/api/auth/login/route.ts` | GitHub OAuth start |
| `src/app/api/auth/callback/route.ts` | OAuth callback |
| `src/app/api/auth/logout/route.ts` | Sign out |
| `src/components/forms/TicketForm.tsx` | Public submission form |
| `src/components/admin/TicketList.tsx` | Filterable ticket table |
| `src/components/admin/TicketDetail.tsx` | Detail + reply view |
| `src/components/admin/KanbanBoard.tsx` | @dnd-kit Kanban board |

### Database
- `supabase/schema.sql` — Full schema with triggers, RLS, indexes

### Documentation (Session 1)
- `README.md` — Quick-start overview
- `docs/SETUP_GUIDE.md` — Step-by-step setup
- `docs/ARCHITECTURE.md` — Technical decisions and file map
- `docs/CONVERSATION_LOG.md` — This file
- `docs/TROUBLESHOOTING.md` — Common errors and fixes

### Build results
- TypeScript check: **0 errors**
- Git: initialized, first commit made

---

# Session 2 — Setup, Debugging, and Deployment

**Date:** Friday, March 20, 2026 (same day, evening)  
**Start:** ~10:00 PM Manila time

---

## 7. Setup Execution

Ohmer followed the setup guide. Issues encountered and resolved:

### Issue 1 — Supabase API Key Format Change
**What happened:** Supabase now shows "Publishable key" and "Secret key" instead of "anon" and "service_role".

**Resolution:** Used the **"Legacy anon, service_role API keys"** tab. Keys in `eyJ...` format are compatible with `@supabase/ssr`.

### Issue 2 — .env.local File Named Wrong
**What happened:** File was saved as `.env` instead of `.env.local`. Next.js was not loading it (confirmed by running `grep ADMIN_EMAIL` which returned no results).

**Resolution:** Renamed `.env` to `.env.local`. Server restarted and confirmed `Environments: .env.local` in terminal.

### Issue 3 — GitHub OAuth Returns HTTP 405
**Root cause:** Login route used `NextResponse.redirect()` which defaults to HTTP 307 (Temporary Redirect). HTTP 307 preserves the original request method — so the browser was POSTing to Supabase's `/auth/v1/authorize` endpoint instead of GETting it. Supabase returned 405 Method Not Allowed.

**Resolution:** Changed redirect status from 307 to 303 (See Other). HTTP 303 always switches to GET regardless of original method.

```typescript
// Before (broken)
return NextResponse.redirect(data.url)

// After (fixed)
return NextResponse.redirect(data.url, { status: 303 })
```

### Issue 4 — Resend Free Tier Restriction
**What happened:** No confirmation emails arriving. Added error logging to email functions and discovered:

```
statusCode: 403
name: 'validation_error'
message: 'You can only send testing emails to your own email address (ohmersulit19@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains'
```

**Root cause:** Resend free plan only allows sending to the email used to sign up. Can't send to arbitrary recipients without domain verification.

**Decision:** Replace Resend with Gmail SMTP via Nodemailer.

**Why Gmail SMTP:**
- Completely free
- No domain required
- Can send to any email address
- 500 emails/day limit (more than enough for personal helpdesk)
- Uses Gmail App Password (no need to share main Gmail password)

**Implementation:**
1. Removed `resend` dependency usage
2. Installed `nodemailer` + `@types/nodemailer`
3. Added `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars
4. Rewrote `src/lib/email.ts` to use Gmail SMTP

**Result:** Emails confirmed working — terminal showed:
```
[email] Sent to cctvinstaller26@gmail.com: [TKT-0003] Your ticket has been received
[email] Sent to ohmersulit@gmail.com: [NEW] [TKT-0003] Test Ticket 3
```

### Issue 5 — Supabase URL Configuration Not Set
**What happened:** After fixing the 307→303 issue, admin login still got 405.

**Resolution:** Went to Supabase → **Authentication → URL Configuration** and added:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**` and `http://localhost:3000/api/auth/callback`

---

## 8. Features Tested and Confirmed Working

| Feature | Test | Result |
|---|---|---|
| Public ticket form | Submitted TKT-0001, TKT-0002, TKT-0003 | Working |
| Tracking page | Opened tracking URLs | Working |
| Progress stepper | Shows Open → In Progress → Resolved → Closed | Working |
| Admin login | GitHub OAuth via Tech-Ohmer account | Working |
| Admin ticket list | Shows all tickets with filters | Working |
| Admin ticket detail | Status/priority controls, reply box | Working |
| Email — ticket created | Sent to submitter + admin | Working |
| Email — status change | Sent to submitter | Working |
| Email — admin reply | Sent to submitter | Working |
| Kanban board | Drag and drop between columns | Working |

---

## 9. Deployment

### GitHub Push
- Repository created: `https://github.com/Tech-Ohmer/Ohms_HelpDesk`
- Authenticated via GitHub CLI (`gh auth login`)
- Code pushed to `main` branch

### Vercel Deployment
- Project imported: `Tech-Ohmer/Ohms_HelpDesk`
- Project name: `ohms-help-desk`
- **Live URL: https://ohms-help-desk.vercel.app**
- Environment variables set (7 total, no RESEND_API_KEY)
- Post-deploy steps completed:
  - Supabase redirect URLs updated with Vercel domain
  - GitHub OAuth app homepage URL updated
  - Admin login confirmed working on live URL

---

## 10. Git Commit History

| Commit | Description |
|---|---|
| `feat: initial scaffold` | All 24 source files, schema, README |
| `docs: add setup guide, architecture, conversation log and troubleshooting` | 4 doc files, 991 lines |
| `fix: use 303 redirect in auth login route` | Fixed GitHub OAuth 405 error |
| `fix: replace Resend with Gmail SMTP via nodemailer` | Email to any recipient, free |
| `docs: update all documentation for deployment` | This update |

---

## 11. Key Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| Stack type | Full web app | Learning project |
| Drag-and-drop | @dnd-kit | Production-grade, maintained |
| Database | Supabase | Free tier, built-in auth |
| Email | Gmail SMTP (nodemailer) | Free, no domain, any recipient |
| Hosting | Vercel | Free, native Next.js |
| Auth method | GitHub OAuth | Personal GitHub exists |
| Redirect status | 303 See Other | Ensures GET for OAuth flow |
| Supabase keys | Legacy `eyJ...` format | Compatible with @supabase/ssr |
| Separation | Personal project only | Not related to work |

---

## 12. Next Session Hints

If you continue this project in a future session:

- **Project is at:** `C:\Users\OhmerSulit\Projects\helpdesk`
- **Live URL:** `https://ohms-help-desk.vercel.app`
- **GitHub:** `https://github.com/Tech-Ohmer/Ohms_HelpDesk`
- **Run locally:** `npm run dev` → `http://localhost:3000`
- **Admin login:** GitHub OAuth with Tech-Ohmer account
- **Email:** Gmail SMTP via `GMAIL_USER` + `GMAIL_APP_PASSWORD` in `.env.local`
- **Database:** Supabase project `Tech-Ohmer's Project` (ID: `qlluqifhljbnbhfyuxeu`)
- **All docs are in:** `C:\Users\OhmerSulit\Projects\helpdesk\docs\`
- **To deploy changes:** `git push origin main` → Vercel auto-deploys
- **Do NOT use:** HelloFresh GitHub org, FusionKitchen repo, Jira, or any work tools
