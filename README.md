# MyPortfolio

Next.js portfolio hosted on Vercel. Its private project CMS uses Supabase PostgreSQL and Supabase Storage.

## Admin dashboard setup

1. Create a Supabase project at https://supabase.com and run `supabase/migrations/20261102000000_create_projects.sql` in SQL Editor.
2. Configure Google OAuth. Add `http://localhost:3000/api/auth/callback/google` for local development and `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google` for production.
3. Copy `.env.example` to `.env.local` and set `NEXTAUTH_URL`, a strong random `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Add the same variables in Vercel Project Settings → Environment Variables. Never expose the Supabase service-role key with a `NEXT_PUBLIC_*` prefix or commit it.
5. Run `npm install` then `npm run dev`; open `/admin`, sign in with an allowlisted Google account, and add projects. Projects are drafts by default; only published projects appear on `/projects`.

## Security

- Admin access uses a server-side `ADMIN_EMAILS` allowlist and is checked on admin pages, server actions, and image uploads.
- Supabase Row Level Security is enabled; browser clients never receive the service-role key.
- The `project-images` bucket is public-read for portfolio rendering. Uploads are server-side, admin-only, MIME-type checked, and limited to 5 MB.
- Existing hardcoded projects remain a fallback until Supabase is configured. They are not automatically imported; add verified projects in the dashboard.
