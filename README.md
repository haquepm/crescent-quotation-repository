# crescent-quotation-repository

## Deployment configuration

The Next.js application is deployed on Vercel and uses the Supabase project for authentication, database access, and private quotation-file storage.

Configure these public client environment variables in Vercel for Production, Preview, and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase publishable key)

Never add a Supabase service-role key or database password to client-side environment variables.

Production domain: `quotation.crescentcontractors.com`
