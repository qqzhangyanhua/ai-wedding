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

   **Supabase (Required)**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-only key for bypassing RLS (webhooks only)

   **Image Generation API (Required, server-only)**:
   - `IMAGE_API_MODE` - Generation mode: `images` (OpenAI/DALL-E) or `chat` (streaming, e.g., Gemini)
   - `IMAGE_API_BASE_URL` - API base URL (e.g., `https://api.openai.com` or `https://api.aioec.tech`)
   - `IMAGE_API_KEY` - API key (never expose to client)
   - `IMAGE_IMAGE_MODEL` - Model for `images` mode (default: `dall-e-3`)
   - `IMAGE_CHAT_MODEL` - Model for `chat` mode (e.g., `gemini-2.5-flash-image`)
   - Fallback: If `IMAGE_*` not set, uses legacy `OPENAI_*` variables

   **MinIO Storage (Optional)**:
   - `MINIO_ENDPOINT` - MinIO server endpoint (e.g., `http://localhost:9000`)
   - `MINIO_ACCESS_KEY` - Access key
   - `MINIO_SECRET_KEY` - Secret key
   - `MINIO_BUCKET_NAME` - Bucket name (e.g., `ai-images`)
   - `MINIO_USE_SSL` - `true` or `false`

   **Payment (Optional)**:
   - `STRIPE_WEBHOOK_SECRET` - For Stripe webhook signature verification
   - `PAYMENT_PROVIDER` - `mock` or `stripe`

3. Run database schema: Execute `database-schema.sql` in Supabase SQL Editor

## Architecture Patterns

### Routing Structure (App Router)
- `app/` - Next.js 14 App Router with all application code
  - **Pages** (route handlers):
    - `app/page.tsx` - Home page
    - `app/templates/page.tsx` - Template gallery
    - `app/create/page.tsx` - Project creation
    - `app/dashboard/page.tsx` - User dashboard
    - `app/results/[id]/page.tsx` - Generation results
    - `app/pricing/page.tsx` - Pricing/credits
    - `app/testimonials/page.tsx` - Testimonials

  - **API Routes** (server-side only):
    - `app/api/**/route.ts` - API route handlers

  - **Shared Code**:
    - `app/components/` - All UI components (page components + reusable UI)
    - `app/hooks/` - Custom React hooks
    - `app/lib/` - Utilities, services, and helpers
    - `app/types/` - TypeScript type definitions
    - `app/contexts/` - React contexts (e.g., AuthContext)
    - `app/data/` - Static data and mock data
    - `app/shared/` - Shared layout components

### Data Layer Architecture

**Client-Side Supabase**:
- `app/lib/supabase.ts` - Lazy-initialized Supabase client with Proxy pattern
- Throws clear error only when first accessed if env vars missing
- Used by hooks for data fetching

**Custom Hooks** (in `app/hooks/`):
- `useProjects` - Fetch user projects with generations (sorted DESC)
- `useTemplates` - Fetch active templates with favorites
- `useFavorites` - Manage template favorites
- `useImageLikes` - Track image likes/unlikes
- `useImageGeneration` - Handle image generation flow
- `useGenerationPolling` - Poll generation status
- `useEngagementStats` - Aggregate likes + downloads stats
- `usePhotoUpload` - Handle photo uploads
- `usePhotoSelection` - Manage photo selection state

**Database Schema** (see `database-schema.sql`):
- `profiles` - User profiles with credits and invite system
  - `invite_code` - Unique invite code per user
  - `invited_by` - Referrer tracking
  - `invite_count` - Total invites sent
  - `reward_credits` - Credits earned from referrals
- `templates` - AI generation templates (categories, prompts, pricing)
- `projects` - User photo projects
- `generations` - AI generation jobs (status, images, credits used)
- `orders` - Payment orders
- `favorites` - User-template favorites
- `image_likes` - Image engagement tracking
- `image_downloads` - Download analytics
- `invite_events` - Invite history and audit trail

All tables use RLS (Row Level Security). Users can only access their own data.

### API Routes

**Server-Side Only APIs** (never expose keys to client):

1. **Image Generation**:
   - `app/api/generate-image/route.ts` - Standard image generation (OpenAI/DALL-E style)
     - Requires Supabase auth token in `Authorization` header
     - Rate limiting: 5 requests/minute per user (in-memory)
     - Validates prompt (max 800 chars)
     - Proxies to OpenAI-compatible endpoint
     - Runs on Edge Runtime for performance

   - `app/api/generate-stream/route.ts` - Streaming generation (chat completions)
     - Used for `IMAGE_API_MODE=chat` (e.g., Gemini)
     - Supports image inputs (max 3 images)
     - Returns Server-Sent Events stream
     - Extracts images from Markdown response

2. **Storage**:
   - `app/api/upload-image/route.ts` - Upload images to MinIO/Supabase storage
     - Supports multiple storage backends
     - Image compression and optimization

3. **Orders/Payments**:
   - `app/api/orders/create/route.ts` - Create order
   - `app/api/orders/validate/route.ts` - Validate order status
   - `app/api/orders/mock/confirm/route.ts` - Mock payment callback (dev only)
   - `app/api/orders/webhook/stripe/route.ts` - Stripe webhook handler (production)
     - Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
     - Verify webhook signature before processing
     - Implement idempotency for duplicate events

4. **Invites**:
   - `app/api/invite/claim/route.ts` - Claim invite code and award credits

5. **Analytics**:
   - `app/api/images/track-download/route.ts` - Track image downloads

6. **Templates**:
   - `app/api/templates/route.ts` - Fetch templates with filters

### Component Organization

**shadcn/ui Components** (in `app/components/ui/`):
- Installed via `pnpm dlx shadcn@latest add [component]`
- Configuration in `components.json`
- Base color: slate, CSS variables enabled

**Path Aliases** (tsconfig.json):
- `@/*` - `./app/*` (app directory root)
- `@/components/*` - `./app/components/*` (UI components)
- `@/hooks/*` - `./app/hooks/*` (custom hooks)
- `@/lib/*` - `./app/lib/*` (utilities)
- `@/types/*` - `./app/types/*` (type definitions)
- `@/contexts/*` - `./app/contexts/*` (React contexts)

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

**Standard Mode** (`IMAGE_API_MODE=images`):
1. User selects template + uploads photos
2. Frontend calls `/api/generate-image` with auth token
3. API validates auth, checks rate limits, proxies to OpenAI-compatible endpoint
4. Response contains image URLs or base64 data
5. Frontend stores generation record in `generations` table

**Streaming Mode** (`IMAGE_API_MODE=chat`):
1. User selects template + uploads photos
2. Frontend calls `/api/generate-stream` with auth token and image inputs
3. API validates auth, constructs chat messages with image URLs
4. Streams Server-Sent Events from upstream API (e.g., Gemini)
5. Frontend parses streamed markdown chunks and extracts Base64 images
6. Displays images progressively as they arrive
7. Stores final result in `generations` table

### Payment Flow (Current: Mock + Stripe Ready)
1. User clicks "Purchase" → Create order via `/api/orders/create`
2. **Mock mode**: Call `/api/orders/mock/confirm` to simulate success
3. **Stripe mode**: Redirect to Stripe Checkout, receive webhook at `/api/orders/webhook/stripe`
4. Webhook updates order status + credits using service role key
5. Frontend polls order status or uses real-time subscriptions

### Invite System Flow
1. User gets unique `invite_code` (generated on profile creation)
2. User shares invite link with friends
3. New user claims code via `/api/invite/claim` on first login
4. System validates code, awards credits to both parties
5. Updates `invited_by`, `invite_count`, `reward_credits` in profiles
6. Records event in `invite_events` table for audit

## Common Patterns

### Fetching User Data
```typescript
import { supabase } from '@/lib/supabase';

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

### Streaming Image Generation
```typescript
// Client-side: Consume SSE stream
const response = await fetch('/api/generate-stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt, image_inputs }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse SSE format: "data: {...}\n\n"
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6));
      // Extract images from markdown content
    }
  }
}
```

## Image Configuration

Next.js Image optimization is configured for (see `next.config.js`):
- `localhost`
- `images.pexels.com`
- `**.supabase.co` (Supabase storage)
- `oaidalleapiprodscus.blob.core.windows.net` (OpenAI DALL-E)
- `123.57.16.107:9000` (MinIO instance)

Add new domains to `next.config.js` → `images.remotePatterns` array.

## Key Services and Utilities

Located in `app/lib/`:

- `supabase.ts` - Lazy-initialized Supabase client (Proxy pattern)
- `generation-service.ts` - Image generation logic and API calls
- `image-stream.ts` - Server-Sent Events parsing for streaming responses
- `minio-client.ts` - MinIO storage client for image uploads
- `image-compress.ts` - Client-side image compression before upload
- `image-quality-checker.ts` - Validate image quality (resolution, format)
- `image-rating.ts` - Image quality scoring system
- `validations.ts` - Zod schemas for API request validation
- `errors.ts` - Custom error classes
- `utils.ts` - General utilities (cn, date formatting, etc.)
- `status.ts` - Generation status types and helpers
- `mock-generator.ts` - Mock data generator for development
- `pricing-recommender.ts` - Dynamic pricing logic
- `share-card.ts` - Social media share card generation
- `logger.ts` - Structured logging utility

All services follow the pattern: single responsibility, explicit types, no `any` types.

## Build Requirements

- Node.js 18+
- pnpm (required package manager)
- TypeScript strict mode enabled
- ESLint and TypeScript errors block builds (`ignoreBuildErrors: false`)
