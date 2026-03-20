# Setup Guide — my-helpdesk

Complete step-by-step guide to get my-helpdesk running locally and deployed.

**Estimated time:** 20–30 minutes  
**Cost:** $0  
**Date written:** March 2026

---

## Prerequisites

- Node.js 18+ installed on your machine
- A personal GitHub account
- A Gmail account (for Supabase and Resend signup)
- VS Code or any code editor

---

## Step 1 — Supabase Project

### 1.1 Create your account and project

1. Go to **https://supabase.com** → click **Start your project**
2. Sign up using your Gmail account (free)
3. Once logged in, click **New Project**
4. Fill in:
   - **Name:** `my-helpdesk`
   - **Database Password:** choose a strong password and save it somewhere
   - **Region:** choose the closest to your location (e.g. Southeast Asia → Singapore)
5. Click **Create new project**
6. Wait approximately 2 minutes for provisioning to complete

### 1.2 Run the database schema

1. In the Supabase sidebar, click **SQL Editor**
2. Click **New query**
3. Open `C:\Users\OhmerSulit\Projects\helpdesk\supabase\schema.sql` in any text editor
4. Select all the text → Copy
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: `Success. No rows returned`

This creates:
- `tickets` table with auto-incrementing ticket numbers (TKT-0001, TKT-0002...)
- `ticket_updates` table for replies and activity
- Row Level Security policies
- Indexes for performance

### 1.3 Copy your API credentials

1. In the Supabase sidebar, click **Project Settings** (gear icon at the bottom)
2. Click **API**
3. Copy and save these three values:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" section |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API keys" → anon / public |
| `SUPABASE_SERVICE_ROLE_KEY` | "Project API keys" → service_role (click to reveal) |

> Keep the service_role key secret. It bypasses Row Level Security.

---

## Step 2 — GitHub OAuth Setup

This allows you to log in to the admin panel using your personal GitHub account.

### 2.1 Get the callback URL from Supabase

1. In Supabase → **Authentication** → **Providers**
2. Find **GitHub** → click to expand
3. Toggle it **ON**
4. Copy the **Callback URL** shown on the page. It looks like:  
   `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
5. Leave this page open

### 2.2 Create a GitHub OAuth App

1. Go to **https://github.com/settings/developers** (your personal GitHub account)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `my-helpdesk`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** paste the URL you copied from Supabase
4. Click **Register application**
5. Copy the **Client ID** shown on the next page
6. Click **Generate a new client secret** → copy the secret immediately (it is only shown once)

### 2.3 Paste credentials into Supabase

1. Go back to Supabase → **Authentication → Providers → GitHub**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

---

## Step 3 — Resend Email Account

### 3.1 Create your account

1. Go to **https://resend.com** → click **Get Started**
2. Sign up with your Gmail (free)
3. Verify your email address

### 3.2 Create an API Key

1. In the Resend dashboard → click **API Keys** in the sidebar
2. Click **Create API Key**
3. Name: `my-helpdesk`
4. Permission: **Full access**
5. Click **Add**
6. Copy the key — it starts with `re_` and is only shown once

> **Free tier limits:** 3,000 emails/month, 100 emails/day.  
> Emails send from `onboarding@resend.dev` on the free tier — no custom domain needed.

---

## Step 4 — Environment Variables

### 4.1 Create your .env.local file

1. Open `C:\Users\OhmerSulit\Projects\helpdesk` in VS Code
2. You will see `.env.example` in the root
3. Copy `.env.example` → rename the copy to `.env.local`

### 4.2 Fill in your values

Open `.env.local` and fill in all 6 variables:

```env
# Supabase — from Step 1.3
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend — from Step 3.2
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# App URL — use localhost for now, update after Vercel deploy
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Your personal email — admin notifications go here
ADMIN_EMAIL=your.personal.email@gmail.com
```

> `.env.local` is listed in `.gitignore` and will never be pushed to GitHub.

---

## Step 5 — Run Locally

1. Open a terminal in `C:\Users\OhmerSulit\Projects\helpdesk`
2. Run:

```bash
npm run dev
```

3. Open **http://localhost:3000** in your browser

### Test the full flow

**Public side:**
- Fill in the ticket submission form → submit
- Check your email for the confirmation with tracking link
- Open the tracking link → verify your ticket appears

**Admin side:**
- Go to **http://localhost:3000/login**
- Click **Continue with GitHub** → authorize the app
- You are redirected to `/admin`
- Click a ticket to open the detail view
- Change the status → verify an email notification is sent
- Add a reply → verify the submitter receives an email
- Go to `/admin/kanban` → drag a ticket card between columns

---

## Step 6 — Push to Personal GitHub

1. Go to **https://github.com/new**
2. Create a new **private** repository:
   - **Repository name:** `my-helpdesk`
   - **Visibility:** Private (recommended)
   - Do NOT initialize with README, .gitignore, or license
3. Click **Create repository**
4. GitHub will show you the remote URL. Copy it.

5. Open a terminal in your project folder and run:

```bash
git remote add origin https://github.com/YOUR_PERSONAL_USERNAME/my-helpdesk.git
git branch -M main
git push -u origin main
```

Your code is now on your personal GitHub account, separate from HelloFresh.

---

## Step 7 — Deploy to Vercel

### 7.1 Create your Vercel account

1. Go to **https://vercel.com**
2. Click **Sign Up** → choose **Continue with GitHub** (your personal account)
3. Authorize Vercel to access your repositories

### 7.2 Import your project

1. Click **Add New → Project**
2. Find `my-helpdesk` in the repository list → click **Import**
3. Vercel auto-detects Next.js — do not change the build settings

### 7.3 Add environment variables

Before clicking Deploy:

1. Expand the **Environment Variables** section
2. Add all 6 variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` → set this to your Vercel URL (you can update it after the first deploy)
   - `ADMIN_EMAIL`

### 7.4 Deploy

1. Click **Deploy**
2. Wait 2–3 minutes
3. Vercel gives you a URL like: `https://my-helpdesk-xxxx.vercel.app`

### 7.5 Post-deploy updates

After your first successful deploy:

1. **Update NEXT_PUBLIC_APP_URL in Vercel:**
   - Go to Vercel → your project → **Settings → Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
   - Go to **Deployments** → click the three dots → **Redeploy** (to pick up the change)

2. **Update your GitHub OAuth App:**
   - Go to **https://github.com/settings/developers** → your `my-helpdesk` OAuth App
   - Update **Homepage URL** to your Vercel URL
   - Update **Authorization callback URL** — this stays as the Supabase URL, no change needed

3. **Verify the live deployment:**
   - Open your Vercel URL in a browser
   - Submit a test ticket
   - Log in to `/admin`
   - Check that emails arrive correctly

---

## Accounts Summary

| Service | URL | Plan | Cost |
|---|---|---|---|
| Supabase | supabase.com | Free | $0 |
| GitHub | github.com | Free | $0 |
| Resend | resend.com | Free | $0 |
| Vercel | vercel.com | Hobby (Free) | $0 |

**Total monthly cost: $0**

---

## What to do if something breaks

See `docs/TROUBLESHOOTING.md` for solutions to common issues.
