# Admin Management — my-helpdesk

How to add, remove, and manage admin access to the helpdesk.

**Last updated:** March 2026

---

## How Admin Access Works

Access to the `/admin` panel is controlled by a single environment variable: `ADMIN_EMAILS`.

- Any person whose **GitHub account email** is in `ADMIN_EMAILS` can log in as admin
- Anyone who logs in via GitHub but is NOT in the list sees an "Access Denied" page
- No database changes needed — just update the env var and redeploy

---

## How to Add a New Admin

### Step 1 — Get their GitHub email

The email must be the **primary email on their GitHub account**.

Ask them to check it at: **https://github.com/settings/emails**

### Step 2 — Update Vercel environment variables

1. Go to **https://vercel.com** → your `ohms-help-desk` project
2. Click **Settings → Environment Variables**
3. Find `ADMIN_EMAILS` → click **Edit**
4. Add the new email, separated by a comma:

```
# Before (just you)
ADMIN_EMAILS=ohmersulit@gmail.com

# After (you + one more)
ADMIN_EMAILS=ohmersulit@gmail.com,newadmin@gmail.com

# After (you + two more)
ADMIN_EMAILS=ohmersulit@gmail.com,newadmin@gmail.com,another@gmail.com
```

5. Click **Save**

### Step 3 — Redeploy

After saving the env var, Vercel needs a redeploy to pick up the change:

1. Vercel → your project → **Deployments**
2. Click the three dots `...` on the latest deployment
3. Click **Redeploy**
4. Wait ~2 minutes

### Step 4 — Tell the new admin how to log in

Send them this link: **https://ohms-help-desk.vercel.app/login**

They click **Continue with GitHub** using their personal GitHub account.
If their GitHub email matches the list, they land on the admin dashboard.

---

## How to Remove an Admin

Same process — just edit `ADMIN_EMAILS` in Vercel, remove their email, save, and redeploy.

---

## How to Update Locally (.env.local)

If you're running the project locally (`npm run dev`), also update your `.env.local`:

```env
ADMIN_EMAILS=ohmersulit@gmail.com,newadmin@gmail.com
```

Restart `npm run dev` after saving — env vars only reload on restart.

---

## What the New Admin Can Do

All admins have the same permissions — there are no role levels currently:

| Action | Admin can do? |
|---|---|
| View all tickets | Yes |
| Search and filter tickets | Yes |
| Change ticket status | Yes |
| Change ticket priority | Yes |
| Reply to tickets (emails submitter) | Yes |
| View Kanban board | Yes |
| Drag tickets between columns | Yes |

---

## What the New Admin Cannot Do

| Action | Available? |
|---|---|
| Add/remove other admins | No — only the Vercel account owner can do this |
| Delete tickets | No — not implemented (data safety) |
| Access Vercel dashboard | No — only the project owner |
| Access Supabase database | No — only the project owner |

---

## Current Admin List

| Name | Email | Added |
|---|---|---|
| Ohmer Sulit | ohmersulit@gmail.com | March 2026 (owner) |

> Update this table when you add or remove admins.

---

## Security Notes

- Admin access is controlled purely by the `ADMIN_EMAILS` environment variable
- The variable is stored in Vercel's encrypted environment variable system
- It is never exposed in the browser (server-side check only)
- If someone's GitHub account is compromised, remove their email from the list immediately and redeploy
- The "Access Denied" page gives no information about the system — it just says access is denied

---

## Quick Reference

| Task | Where |
|---|---|
| Add/remove admin | Vercel → Settings → Environment Variables → `ADMIN_EMAILS` |
| Find someone's GitHub email | github.com/settings/emails |
| After any change | Vercel → Deployments → Redeploy |
| Login URL to share | https://ohms-help-desk.vercel.app/login |
