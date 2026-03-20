# Setup Guide — my-helpdesk

Complete step-by-step guide to get my-helpdesk running locally and deployed to production.

**Live URL:** https://ohms-help-desk.vercel.app  
**Estimated setup time:** 20–30 minutes  
**Cost:** $0  
**Last updated:** March 2026

---

## Prerequisites

- Node.js 18+ installed on your machine
- A personal GitHub account
- A Gmail account
- VS Code or any code editor

---

## Step 1 — Supabase Project

### 1.1 Create your account and project

1. Go to **https://supabase.com** → click **Start your project**
2. Sign up using your Gmail account (free)
3. Once logged in, click **New Project**
4. Fill in:
   - **Name:** `my-helpdesk`
   - **Database Password:** choose a strong password and save it somewhere safe
   - **Region:** closest to your location (e.g. Southeast Asia → Singapore)
5. Click **Create new project**
6. Wait approximately 2 minutes for provisioning

### 1.2 Run the database schema

1. In the Supabase sidebar → click **SQL Editor**
2. Click **New query**
3. Open `supabase/schema.sql` from the project folder in any text editor
4. Select all → Copy → Paste into the Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`

This creates:
- `tickets` table with auto-incrementing ticket numbers (TKT-0001, TKT-0002...)
- `ticket_updates` table for replies and activity
- Row Level Security (RLS) policies
- Indexes for performance

### 1.3 Copy your API credentials

1. Go to **Project Settings → API Keys**
2. Click the **"Legacy anon, service_role API keys"** tab
   > Use the legacy tab — keys start with `eyJ...` and are compatible with `@supabase/ssr`
3. Copy:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → General → Project ID → build: `https://[ID].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy tab → `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy tab → `service_role` (click Reveal) |

---

## Step 2 — GitHub OAuth

This lets you log in to the admin panel with your GitHub account.

### 2.1 Get the callback URL from Supabase

1. Supabase → **Authentication → Sign In / Providers**
2. Click **GitHub** → toggle **ON**
3. Copy the **Callback URL** (looks like `https://xxxx.supabase.co/auth/v1/callback`)
4. Leave the panel open

### 2.2 Create a GitHub OAuth App

1. Go to **https://github.com/settings/developers** (your personal account)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `my-helpdesk`
   - **Homepage URL:** `http://localhost:3000` (update after Vercel deploy)
   - **Authorization callback URL:** paste the Supabase callback URL from step 2.1
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** → copy immediately (shown only once)

### 2.3 Save credentials in Supabase

1. Go back to Supabase → **Authentication → Sign In / Providers → GitHub**
2. Paste **Client ID** and **Client Secret**
3. Click **Save**

### 2.4 Configure redirect URLs

1. Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Under **Redirect URLs** → Add:
   - `http://localhost:3000/**`
   - `http://localhost:3000/api/auth/callback`
4. Click **Save**

---

## Step 3 — Gmail App Password (Email Setup)

This allows the app to send emails from your Gmail account to **any** email address — completely free, no domain required.

> **Why not Resend?** Resend's free tier only allows sending to the email you signed up with. Gmail SMTP works with any recipient.

### 3.1 Enable 2-Step Verification (if not already)

1. Go to **https://myaccount.google.com/security**
2. Find **2-Step Verification** → turn it ON if not already enabled

### 3.2 Create an App Password

1. Go to **https://myaccount.google.com/apppasswords**
2. Sign in with the Gmail you want to send from
3. App name: `my-helpdesk`
4. Click **Create**
5. Copy the **16-character password** — it's shown only once
   (e.g. `abcd efgh ijkl mnop` — spaces are fine)

---

## Step 4 — Environment Variables

### 4.1 Create your .env.local file

```bash
cp .env.example .env.local
```

### 4.2 Fill in all 7 variables

Open `.env.local` and paste your real values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Gmail SMTP
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=your_email@gmail.com
```

> `.env.local` is gitignored — it will never be committed or pushed to GitHub.

---

## Step 5 — Run Locally

```bash
npm run dev
```

Open **http://localhost:3000**

### Test the full flow

**Public side:**
1. Fill in the ticket submission form → Submit
2. Check your email for the confirmation with tracking link
3. Open the tracking link — verify the ticket status page loads

**Admin side:**
1. Go to **http://localhost:3000/login**
2. Click **Continue with GitHub** → authorize
3. You land on `/admin` — TKT-0001 should be visible
4. Click a ticket → change status → verify email notification arrives
5. Send a reply → verify email arrives
6. Go to `/admin/kanban` → drag a ticket to a different column

---

## Step 6 — Push to Personal GitHub

1. Go to **https://github.com/new** (your personal account)
2. Repository name: `Ohms_HelpDesk` (or any name you prefer)
3. Visibility: Public or Private
4. Leave all checkboxes unchecked → **Create repository**

Then in your terminal (inside the project folder):

```bash
# Authenticate GitHub CLI first (only needed once)
gh auth login
# Follow the prompts: GitHub.com → HTTPS → Login with browser

# Push the code
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 7 — Deploy to Vercel

### 7.1 Create Vercel account

1. Go to **https://vercel.com** → **Sign Up** → **Continue with GitHub** (your personal account)

### 7.2 Import project

1. Click **Add New → Project**
2. Find your GitHub repo → click **Import**
3. Vercel detects Next.js automatically — do NOT change build settings

### 7.3 Add environment variables

**Before clicking Deploy** — expand **Environment Variables** → click **Import .env**:

1. Open your `.env.local` → select all → copy → paste into Vercel
2. **Change `NEXT_PUBLIC_APP_URL`** from `http://localhost:3000` to your Vercel URL:
   ```
   NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
   ```
3. Confirm the import

### 7.4 Deploy

Click **Deploy** → wait 2–3 minutes.

### 7.5 Post-deploy updates

After your first successful deploy:

**Update Supabase redirect URLs:**
1. Supabase → **Authentication → URL Configuration**
2. Add to Redirect URLs:
   - `https://your-project.vercel.app/**`
   - `https://your-project.vercel.app/api/auth/callback`
3. Click Save

**Update GitHub OAuth App:**
1. **https://github.com/settings/developers** → your OAuth App
2. Update **Homepage URL** to your Vercel URL
3. The **Callback URL** (Supabase) stays unchanged
4. Click **Update application**

**Verify the live site:**
- Open your Vercel URL → submit a test ticket
- Go to `/login` → sign in with GitHub
- Check admin panel is working

---

## Accounts Required

| Service | URL | Plan | Cost |
|---|---|---|---|
| Supabase | supabase.com | Free | $0 |
| GitHub | github.com | Free | $0 |
| Google | Gmail | Free | $0 |
| Vercel | vercel.com | Hobby | $0 |

**Total: $0/month forever**

---

## Common Issues

See `docs/TROUBLESHOOTING.md` for solutions to all known issues.

---

## Known Bugs Fixed

| Bug | Fix |
|---|---|
| GitHub OAuth returns 405 | Changed login redirect from 307 to 303 (preserves GET method) |
| Resend free tier restriction | Replaced Resend with Gmail SMTP (nodemailer) — no recipient restrictions |
| `.env.local` not found | File was named `.env` instead of `.env.local` |
| Supabase 405 on authorize | Added `localhost:3000/**` and exact callback URL to redirect allow list |
