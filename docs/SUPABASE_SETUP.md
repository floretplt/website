# Supabase: storage bucket + admin login

Do this in the [Supabase Dashboard](https://supabase.com/dashboard) after you’ve created a project and run the SQL migration (`supabase/migrations/001_initial.sql`).

---

## 1. Create the `products` storage bucket

1. Open your **project** → left sidebar → **Storage**.
2. Click **New bucket**.
3. **Name:** `products` (exactly, lowercase).
4. Turn **Public bucket** **ON**  
   (the shop loads images from URLs like `/storage/v1/object/public/products/...`).
5. Click **Create**.

Optional — if uploads from the admin API fail with “permission denied”, add a policy so authenticated users can upload (or rely on the **service role** only from your server; the app uses `SUPABASE_SERVICE_ROLE_KEY` for uploads):

- **Storage** → **Policies** on bucket `products`, or **Configuration** → **Policies**.
- For a simple setup, “Public read” is enough for the storefront; writes go through your Next.js API with the service role key and bypass storage RLS when using the admin client correctly.

If you only use **server-side** uploads with the service role, you often don’t need extra policies for anon users.

---

## 2. Create the admin user (Auth)

1. Left sidebar → **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter:
   - **Email** — e.g. `you@yourdomain.com` (use a real inbox you control for password reset).
   - **Password** — choose a strong password.
4. Leave “Auto confirm user” **enabled** if you see it (so you can log in immediately without email confirmation).
5. Click **Create user**.

Also check **Authentication** → **Providers** → **Email** is enabled (it is by default).

---

## 3. Set `ADMIN_EMAIL` in your app

The admin panel (`/admin`) only allows the user whose **email matches** this variable (in production).

1. Open `.env.local` in the project root (copy from `.env.example` if needed).
2. Add or edit:

```env
ADMIN_EMAIL=you@yourdomain.com
```

Use the **same email** you used for the Supabase user in step 2 (character for character).

3. Save the file and **restart** the dev server (`Ctrl+C`, then `npm run dev`).

---

## 4. Fill in the rest of `.env.local`

At minimum you need:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAIL=your_admin@email.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keys — all on one page:

1. Left sidebar → **Project Settings** (gear icon) → **API**.
2. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. **Publishable** (or “anon” / “public”) key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Scroll to **Secret keys** (or “Project API keys”) → **`service_role`** → copy the long JWT. That value is **`SUPABASE_SERVICE_ROLE_KEY`**. Use **Reveal** / **Copy** if shown.

**Important:** The service role bypasses Row Level Security. Treat it like a root password: server-side and env files only, never `NEXT_PUBLIC_*`, never client-side code.

---

## 5. Log in to the admin panel

1. Run `npm run dev`.
2. Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login).
3. Sign in with the **email and password** you created in Supabase (step 2).

If login fails, check: email/password, `ADMIN_EMAIL` matches exactly, and you restarted the dev server after changing `.env.local`.
