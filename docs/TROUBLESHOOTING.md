# Troubleshooting — my-helpdesk

Solutions to common errors you may encounter during setup, development, or after deployment.

---

## Local Development Issues

---

### Error: `NEXT_PUBLIC_SUPABASE_URL` is not set

**Symptom:** App crashes on startup with environment variable errors, or Supabase calls fail silently.

**Cause:** `.env.local` does not exist or is missing variables.

**Fix:**
1. Make sure you copied `.env.example` → `.env.local` (not renamed, copied)
2. Verify `.env.local` is in the root of the project (same level as `package.json`)
3. Make sure all 6 variables are filled in with real values, not placeholder text
4. Restart `npm run dev` — Next.js only reads `.env.local` on startup

---

### Error: `Invalid API key` from Supabase

**Symptom:** Supabase returns 401 or "Invalid API key" errors.

**Cause:** Wrong key pasted — anon key and service_role key look similar but are different.

**Fix:**
1. Go to Supabase → **Project Settings → API**
2. The **anon/public** key goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. The **service_role** key (secret, must click to reveal) goes in `SUPABASE_SERVICE_ROLE_KEY`
4. Do not swap them — the service_role key bypasses all security if exposed publicly

---

### Error: Ticket submission fails with database error

**Symptom:** Form submits but returns an error, no ticket appears in Supabase.

**Cause:** The database schema was not run, or was run with errors.

**Fix:**
1. Go to Supabase → **SQL Editor**
2. Run the contents of `supabase/schema.sql` again
3. Check for any red error messages in the SQL Editor output
4. Verify the `tickets` and `ticket_updates` tables exist in **Table Editor**
5. Verify the `ticket_number_seq` sequence exists in **Database → Sequences**

---

### Error: GitHub OAuth redirects to wrong URL or shows "redirect_uri mismatch"

**Symptom:** After clicking "Continue with GitHub", GitHub shows an error about mismatched redirect URI.

**Cause:** The GitHub OAuth App's callback URL does not match what Supabase expects.

**Fix:**
1. Go to **https://github.com/settings/developers** → your `my-helpdesk` OAuth App
2. Check the **Authorization callback URL** — it must be exactly:  
   `https://[your-project-ref].supabase.co/auth/v1/callback`
3. Get the exact URL from Supabase → **Authentication → Providers → GitHub**
4. Copy it exactly — no trailing slash, no extra characters
5. Save the GitHub OAuth App → try logging in again

---

### Error: After GitHub login, redirected back to `/login` instead of `/admin`

**Symptom:** OAuth completes but you land back on the login page.

**Cause 1:** The Supabase GitHub provider is not enabled.  
**Fix:** Supabase → **Authentication → Providers → GitHub** → make sure toggle is ON and saved.

**Cause 2:** Session cookie is not being set correctly in development.  
**Fix:** Make sure you are accessing the app via `http://localhost:3000` (not `127.0.0.1`). Cookies may not work on `127.0.0.1` in some browsers.

---

### Error: Emails not arriving

**Symptom:** Ticket submitted successfully but no confirmation email received.

**Cause 1:** `RESEND_API_KEY` is wrong or missing.  
**Fix:** Check `.env.local` — the key must start with `re_`. Restart `npm run dev`.

**Cause 2:** Email went to spam.  
**Fix:** Check your spam/junk folder. Free Resend tier sends from `onboarding@resend.dev` which some spam filters catch.

**Cause 3:** `ADMIN_EMAIL` is wrong.  
**Fix:** Check `.env.local` — `ADMIN_EMAIL` must be a valid email address you control.

**Cause 4:** Resend daily limit reached (100 emails/day on free tier).  
**Fix:** Wait until the next day, or check Resend dashboard for usage.

---

### Error: Tracking page shows 404

**Symptom:** Clicking the tracking link returns a 404 page.

**Cause 1:** `NEXT_PUBLIC_APP_URL` is set to the wrong URL.  
**Fix:** In development, set `NEXT_PUBLIC_APP_URL=http://localhost:3000`. After deployment, set it to your Vercel URL.

**Cause 2:** The ticket was not actually created (silent form failure).  
**Fix:** Check the browser console and Next.js terminal for errors when submitting.

---

### Error: Kanban drag-and-drop does not work

**Symptom:** Ticket cards cannot be dragged, or dropping does nothing.

**Cause 1:** JavaScript error in the console blocking @dnd-kit.  
**Fix:** Open browser developer tools → Console tab → look for any red errors.

**Cause 2:** Touch/pointer events not registering.  
**Fix:** @dnd-kit uses PointerSensor with a 5px activation distance — click and drag at least 5 pixels before releasing. This prevents accidental drags on click.

---

## Deployment Issues (Vercel)

---

### Error: Build fails on Vercel

**Symptom:** Vercel deployment fails with TypeScript or build errors.

**Fix:**
1. Run `npx tsc --noEmit` locally first — fix any TypeScript errors
2. Run `npm run build` locally — fix any build errors
3. Push the fixed code to GitHub → Vercel will redeploy automatically

---

### Error: App works locally but fails on Vercel

**Symptom:** Everything works with `npm run dev` but breaks after deployment.

**Cause:** Missing environment variables on Vercel.

**Fix:**
1. Go to Vercel → your project → **Settings → Environment Variables**
2. Make sure all 6 variables are added (not just some)
3. Make sure `NEXT_PUBLIC_APP_URL` is set to your actual Vercel URL (not `localhost`)
4. After adding/changing env vars → go to **Deployments** → **Redeploy** the latest

---

### Error: Admin login works locally but fails on Vercel

**Symptom:** GitHub OAuth works in development but not on the deployed URL.

**Cause:** GitHub OAuth App is still configured with `localhost` URLs.

**Fix:**
1. Go to **https://github.com/settings/developers** → your `my-helpdesk` OAuth App
2. Update **Homepage URL** to your Vercel URL (e.g. `https://my-helpdesk-xxxx.vercel.app`)
3. The **Authorization callback URL** stays as the Supabase URL — no change needed
4. Save the changes

---

### Error: Tracking links in emails point to localhost

**Symptom:** Emails are sent but the tracking links go to `http://localhost:3000/track/...` instead of your live URL.

**Cause:** `NEXT_PUBLIC_APP_URL` is still set to `localhost` in Vercel environment variables.

**Fix:**
1. Vercel → your project → **Settings → Environment Variables**
2. Edit `NEXT_PUBLIC_APP_URL` → set it to your Vercel URL
3. Redeploy

---

### Error: `supabase/schema.sql` tables already exist

**Symptom:** Running the schema SQL a second time gives errors like "relation already exists".

**Cause:** You ran the schema before and the tables are already created.

**Fix:** This is harmless — the schema uses `CREATE TABLE IF NOT EXISTS` and `CREATE EXTENSION IF NOT EXISTS`. The error messages for sequences and triggers are safe to ignore if everything was already set up correctly. Verify your tables exist in Supabase → **Table Editor**.

---

## General Tips

- **Always restart `npm run dev`** after changing `.env.local` — Next.js does not hot-reload environment variables.
- **Check Supabase logs** for database errors: Supabase → **Logs → Postgres**.
- **Check Resend dashboard** to see if emails were sent and any delivery errors.
- **Check Vercel logs** for runtime errors: Vercel → your project → **Logs**.
- **Use Supabase Table Editor** to inspect what data is actually in the database when debugging ticket creation issues.

---

## Getting More Help

- **Next.js docs:** https://nextjs.org/docs
- **Supabase docs:** https://supabase.com/docs
- **Resend docs:** https://resend.com/docs
- **@dnd-kit docs:** https://docs.dndkit.com
- **Vercel docs:** https://vercel.com/docs
