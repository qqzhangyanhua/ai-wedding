# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Wedding Photo Platform - A Next.js 14 application for generating AI-powered wedding photos using OpenAI-compatible image generation APIs and Supabase backend.

**Tech Stack**: Next.js 14 (App Router) + React 18 + TypeScript + TailwindCSS + Supabase + shadcn/ui + Lucide Icons

## Essential Commands

### Development
```bash
pnpm dev          # Start development server (Next.js dev mode)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint checks
pnpm typecheck    # Run TypeScript type checking (strict mode)
```

**Note**: This project uses `pnpm` as the package manager. Do NOT use `npm` or `yarn`.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure required variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-only key for bypassing RLS (webhooks)
   - `OPENAI_BASE_URL` - OpenAI API base URL (default: https://api.openai.com)
   - `OPENAI_API_KEY` - OpenAI API key (server-only, never expose to client)
   - `OPENAI_IMAGE_MODEL` - Image model (default: dall-e-3)
   - `STRIPE_WEBHOOK_SECRET` - For Stripe webhook signature verification
   - `PAYMENT_PROVIDER` - `mock` or `stripe`

3. Run database schema: Execute `database-schema.sql` in Supabase SQL Editor

## Architecture Patterns

### Routing Structure (App Router)
- `app/` - Next.js 14 App Router pages and layouts
  - `app/page.tsx` - Home page
  - `app/templates/page.tsx` - Template gallery
  - `app/create/page.tsx` - Project creation
  - `app/dashboard/page.tsx` - User dashboard
  - `app/results/[id]/page.tsx` - Generation results
  - `app/pricing/page.tsx` - Pricing/credits
  - `app/api/**/route.ts` - API routes (server-side only)

- `src/views/` - Legacy page components (migration in progress)
  - These are being gradually migrated to pure UI components
  - App Router pages act as data/routing shells that import view components

### Data Layer Architecture

**Client-Side Supabase**:
- `src/lib/supabase.ts` - Lazy-initialized Supabase client with Proxy pattern
- Throws clear error only when first accessed if env vars missing
- Used by hooks for data fetching

**Custom Hooks** (in `src/hooks/`):
- `useProjects` - Fetch user projects with generations (sorted DESC)
- `useTemplates` - Fetch active templates with favorites
- `useFavorites` - Manage template favorites
- `useImageLikes` - Track image likes/unlikes
- `useEngagementStats` - Aggregate likes + downloads stats

**Database Schema** (see `database-schema.sql`):
- `profiles` - User profiles with credits
- `templates` - AI generation templates (categories, prompts, pricing)
- `projects` - User photo projects
- `generations` - AI generation jobs (status, images, credits used)
- `orders` - Payment orders
- `favorites` - User-template favorites
- `image_likes` - Image engagement tracking
- `image_downloads` - Download analytics

All tables use RLS (Row Level Security). Users can only access their own data.

### API Routes

**Server-Side Only APIs** (never expose keys to client):

1. **Image Generation** - `app/api/generate-image/route.ts`
   - Requires Supabase auth token in `Authorization` header
   - Rate limiting: 5 requests/minute per user (in-memory)
   - Validates prompt (max 800 chars)
   - Proxies to OpenAI-compatible endpoint
   - Runs on Edge Runtime for performance

2. **Orders/Payments**:
   - `app/api/orders/create/route.ts` - Create order
   - `app/api/orders/mock/confirm/route.ts` - Mock payment callback (dev only)
   - `app/api/orders/webhook/stripe/route.ts` - Stripe webhook handler (production)
     - Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
     - Verify webhook signature before processing
     - Implement idempotency for duplicate events

3. **Analytics**:
   - `app/api/images/track-download/route.ts` - Track image downloads

### Component Organization

**shadcn/ui Components** (in `components/ui/`):
- Installed via `pnpm dlx shadcn@latest add [component]`
- Configuration in `components.json`
- Base color: slate, CSS variables enabled

**Path Aliases** (tsconfig.json):
- `@/*` - Root directory
- `@/components` - UI components
- `@/lib/utils` - Utilities
- `@/components/ui` - shadcn/ui components

### Type Safety Rules

**CRITICAL**:
- NO `any` types allowed - all TypeScript types must be explicit
- Use strict mode (`strict: true` in tsconfig.json)
- Types should be defined in separate `types.ts` files
- Run `pnpm typecheck` before committing

### Code Organization Rules

**File Size Limit**:
- Single file MUST NOT exceed 500 lines
- If a file grows beyond 500 lines:
  - Extract subcomponents to separate files
  - Create custom hooks to encapsulate logic
  - Split into logical modules

**Icon Usage**:
- Use Lucide React icons (`lucide-react` package)
- Do NOT use emoji in code or UI

## Key Implementation Details

### Supabase Client Pattern
The Supabase client uses a Proxy pattern for lazy initialization. It won't throw errors at import time if env vars are missing - only when first method is called. This prevents build-time crashes.

### Image Generation Flow
1. User selects template + uploads photos
2. Frontend calls `/api/generate-image` with auth token
3. API validates auth, checks rate limits, proxies to OpenAI
4. Response contains image URLs or base64 data
5. Frontend stores generation record in `generations` table

### Payment Flow (Current: Mock + Stripe Ready)
1. User clicks "Purchase" → Create order via `/api/orders/create`
2. **Mock mode**: Call `/api/orders/mock/confirm` to simulate success
3. **Stripe mode**: Redirect to Stripe Checkout, receive webhook at `/api/orders/webhook/stripe`
4. Webhook updates order status + credits using service role key
5. Frontend polls order status or uses real-time subscriptions

### Migration Status
- Migrating from Vite + React SPA → Next.js App Router
- Old route components deleted: `src/pages/*`, `index.html`, `vite.config.ts`
- View components in `src/views/*` are gradually being refactored into pure UI components
- App Router pages in `app/*` handle data fetching and routing

## Common Patterns

### Fetching User Data
```typescript
import { supabase } from '@/src/lib/supabase';

const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('projects')
  .select('*, generations(*)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### Protected API Routes
```typescript
const authHeader = req.headers.get('authorization');
const token = authHeader?.split(' ')[1];
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } },
});
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Using Service Role (Webhooks Only)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
);
```

## Image Configuration

Next.js Image optimization is configured for:
- `localhost`
- `images.pexels.com`

Add new domains to `next.config.js` → `images.domains` array.

## Build Requirements

- Node.js 18+
- pnpm (required package manager)
- TypeScript strict mode enabled
- ESLint and TypeScript errors block builds (`ignoreBuildErrors: false`)
