# Troubleshooting — my-helpdesk

Solutions to all known errors encountered during setup, development, and deployment.

**Last updated:** March 2026

---

## Local Development Issues

---

### Error: `NEXT_PUBLIC_SUPABASE_URL` is not set / env vars not loading

**Symptom:** App crashes on startup, or Supabase calls fail silently.

**Cause:** `.env.local` does not exist, or was named incorrectly (e.g. `.env` instead of `.env.local`).

**Fix:**
1. Make sure the file is named exactly `.env.local` (dot at the start, `.local` at the end)
2. It must be in the root of the project (same level as `package.json`)
3. Restart `npm run dev` — Next.js only reads env vars on startup
4. Confirm the terminal shows `Environments: .env.local` after restart

> Real case: During initial setup the file was saved as `.env`. Renaming to `.env.local` fixed it.

---

### Supabase API keys — which tab to use

**Symptom:** Confusion between "Publishable key" / "Secret key" (new format) vs `anon` / `service_role` (legacy format).

**Cause:** Supabase updated their API key format. The new `sb_publishable_...` and `sb_secret_...` keys may not be compatible with older versions of `@supabase/ssr`.

**Fix:** Use the **"Legacy anon, service_role API keys"** tab in Supabase → Settings → API Keys. Keys in `eyJ...` (JWT) format are guaranteed to work with `@supabase/ssr`.

---

### Error: GitHub OAuth returns HTTP 405

**Symptom:** After clicking "Continue with GitHub" on the login page, the browser shows `HTTP ERROR 405` on the Supabase authorize URL.

**Root cause:** The login form uses `method="POST"`. The API route (`/api/auth/login`) redirected using HTTP 307 (Temporary Redirect), which preserves the POST method. When the browser followed the redirect to Supabase's `/auth/v1/authorize`, it sent a POST request — but that endpoint only accepts GET. Supabase returned 405 Method Not Allowed.

**Fix applied:** Changed the redirect status to **303 (See Other)**, which always switches to GET regardless of the original method.

```typescript
// src/app/api/auth/login/route.ts
// Before (broken — 307 preserves POST)
return NextResponse.redirect(data.url)

// After (fixed — 303 always uses GET)
return NextResponse.redirect(data.url, { status: 303 })
```

---

### Error: GitHub OAuth 405 even after the 303 fix

**Symptom:** Still getting 405 from Supabase after the redirect fix.

**Cause:** Supabase is blocking the redirect to `localhost:3000` because it's not in the allowed redirect URLs list.

**Fix:**
1. Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Under **Redirect URLs** → Add:
   - `http://localhost:3000/**`
   - `http://localhost:3000/api/auth/callback`
4. Click **Save**

---

### Error: After GitHub login, redirected back to `/login`

**Symptom:** OAuth completes in the browser (GitHub authorizes) but you land on the login page again.

**Cause 1:** Supabase GitHub provider not fully configured (Client ID or Secret missing).
**Fix:** Supabase → Authentication → Sign In / Providers → GitHub → confirm both Client ID and Client Secret are saved.

**Cause 2:** Session cookie not set correctly.
**Fix:** Access the app via `http://localhost:3000` (not `127.0.0.1`). Cookies may not work on `127.0.0.1` in some browsers.

---

### Emails not arriving — Resend free tier restriction

**Symptom:** No emails arriving. After adding error logging, terminal shows:

```
statusCode: 403
name: 'validation_error'
message: 'You can only send testing emails to your own email address (xxx@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains'
```

**Root cause:** Resend's free plan only allows sending to the email used to sign up. Any other recipient is blocked unless you verify a domain.

**Fix applied:** Replaced Resend entirely with **Gmail SMTP via Nodemailer**.

- Completely free
- No domain needed
- Sends to any email address
- 500 emails/day via Gmail

**Implementation:**
1. Installed `nodemailer` and `@types/nodemailer`
2. Rewrote `src/lib/email.ts` to use Gmail SMTP
3. Added `GMAIL_USER` and `GMAIL_APP_PASSWORD` to `.env.local`
4. Removed `RESEND_API_KEY` from env vars (no longer needed)

**To get Gmail App Password:**
1. Enable 2-Step Verification at https://myaccount.google.com/security
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for `my-helpdesk`
4. Copy the 16-character password → use as `GMAIL_APP_PASSWORD`

---

### Emails not arriving — GMAIL_USER or GMAIL_APP_PASSWORD not set

**Symptom:** Terminal shows: `[email] GMAIL_USER or GMAIL_APP_PASSWORD not set in .env.local`

**Fix:** Add both variables to `.env.local` and restart `npm run dev`:
```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

### Emails not arriving — Gmail blocking the App Password

**Symptom:** Terminal shows an authentication error from nodemailer about invalid credentials.

**Cause:** 2-Step Verification is not enabled on the Gmail account, so App Passwords are not available.

**Fix:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Then go to https://myaccount.google.com/apppasswords
4. Create a new App Password and update `GMAIL_APP_PASSWORD` in `.env.local`

---

### Warning: "middleware" file convention is deprecated

**Symptom:** Terminal shows: `The "middleware" file convention is deprecated. Please use "proxy" instead.`

**Cause:** Next.js 16 / Turbopack changed the recommended location for the middleware file. `src/middleware.ts` triggers a deprecation warning.

**Status:** Warning only — does not break functionality. The middleware still runs and admin routes are protected. Can be resolved in a future Next.js update.

---

### Warning: Next.js inferred wrong workspace root

**Symptom:** Terminal shows: `Next.js inferred your workspace root, but it may not be correct. We detected multiple lockfiles...`

**Cause:** There is a `package-lock.json` in `C:\Users\OhmerSulit\` (root of user directory) from another project, which confuses Turbopack's workspace detection.

**Status:** Warning only — does not affect functionality. The app runs correctly on `localhost:3000`.

---

## Deployment Issues (Vercel)

---

### Build fails on Vercel

**Fix:**
1. Run `npx tsc --noEmit` locally — fix any TypeScript errors first
2. Run `npm run build` locally — fix any build errors
3. Push the fixed code → Vercel auto-redeploys

---

### App works locally but broken on Vercel

**Most common cause:** Missing or wrong environment variables on Vercel.

**Fix:**
1. Vercel → your project → **Settings → Environment Variables**
2. Verify all 7 variables are present
3. Verify `NEXT_PUBLIC_APP_URL` is set to your Vercel URL (not `localhost`)
4. After changing env vars → **Deployments → Redeploy**

---

### Admin login works locally but not on Vercel (405 again)

**Cause:** The Redirect URLs in Supabase only have `localhost` entries.

**Fix:**
1. Supabase → **Authentication → URL Configuration → Redirect URLs**
2. Add:
   - `https://your-project.vercel.app/**`
   - `https://your-project.vercel.app/api/auth/callback`
3. Save

---

### Email tracking links point to localhost after deployment

**Cause:** `NEXT_PUBLIC_APP_URL` is still set to `http://localhost:3000` in Vercel env vars.

**Fix:**
1. Vercel → project → **Settings → Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to `https://your-project.vercel.app`
3. Redeploy

---

### Supabase schema errors when running schema.sql

**Symptom:** SQL Editor shows errors like "relation already exists".

**Cause:** Schema was already run before — tables exist.

**Status:** Harmless — schema uses `CREATE TABLE IF NOT EXISTS`. Verify tables exist in Supabase → **Table Editor**.

---

## General Tips

- **Always restart `npm run dev`** after editing `.env.local`
- **Check Vercel logs** for runtime errors: Vercel → project → **Logs**
- **Check Supabase logs** for database errors: Supabase → **Logs → Postgres**
- **Check terminal output** — email errors and server action errors are logged there
- **Use Supabase Table Editor** to inspect actual data when debugging ticket creation

---

## Reference Links

| Resource | URL |
|---|---|
| Next.js docs | https://nextjs.org/docs |
| Supabase docs | https://supabase.com/docs |
| @dnd-kit docs | https://docs.dndkit.com |
| Nodemailer docs | https://nodemailer.com/about |
| Vercel docs | https://vercel.com/docs |
| Gmail App Passwords | https://myaccount.google.com/apppasswords |
