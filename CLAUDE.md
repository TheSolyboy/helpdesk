# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (starts on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## Tech Stack

- **Next.js 14** with App Router (not Pages Router)
- **TypeScript** with strict mode enabled
- **Supabase** for database, authentication, and Row Level Security (RLS)
- **Tailwind CSS** for styling
- Path alias: `@/*` maps to the root directory

## Architecture Overview

### Authentication & Authorization

**Three Supabase Client Types:**
- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/server.ts` - Server client with cookie handling for server components and API routes
- `lib/supabase/middleware.ts` - Middleware client for session refresh

**Role-Based Access Control:**
- Two roles: `admin` and `agent` (defined in `profiles` table)
- Admins: Full access to all tickets, can assign tickets, set priorities, and update statuses
- Agents: Only see their assigned tickets, can only update ticket status
- Role checks are enforced both in API routes and dashboard pages
- Login redirects based on role: admins to `/dashboard`, agents to `/dashboard/agent`

### Supabase Database Schema

**Tables:**
- `profiles` - User profiles with role (admin/agent)
  - RLS enabled: authenticated users can view all profiles, users can update their own
- `tickets` - Support tickets
  - RLS enabled: anonymous users can insert, authenticated users can view/update all
  - Indexes on: status, assigned_to, created_at

**Ticket Workflow:**
1. Public users submit tickets via homepage form (no auth required)
2. Ticket created with status='open', priority='medium', assigned_to=null
3. n8n webhook notification sent to `https://n8n.solynex.me/webhook/helpdesk-new`
4. Admins can assign tickets to agents and manage priority
5. Agents work on assigned tickets and update status

### API Routes Pattern

All API routes follow this pattern:
1. Create Supabase server client
2. Check authentication via `supabase.auth.getUser()`
3. Fetch user profile to get role
4. Apply role-based permissions
5. Execute database operation
6. Return JSON response

**Key Routes:**
- `POST /api/tickets` - Create ticket (public, no auth)
- `GET /api/tickets` - List tickets (authenticated, filtered by role)
- `PATCH /api/tickets/[id]` - Update ticket (authenticated, permissions by role)

### Server Components vs Client Components

- Dashboard pages (`app/dashboard/page.tsx`, `app/dashboard/agent/page.tsx`) are **server components**
  - Handle auth checks and redirects
  - Fetch initial data server-side
  - Pass `isAdmin` prop to determine UI capabilities
- `components/ticket-list.tsx` is a **client component** ('use client')
  - Manages ticket filtering, updates, and real-time interactions
  - Uses browser Supabase client for operations

### Important Implementation Details

**Middleware:**
- Runs on all routes except static assets and images (see `middleware.ts` config)
- Refreshes Supabase session on each request
- Does NOT handle route protection - pages handle their own auth checks

**Server Actions:**
- Login logic in `app/login/actions.ts` uses 'use server'
- Handles auth and role-based redirects

**Type Definitions:**
- All types centralized in `lib/types.ts`
- Ticket statuses: 'open' | 'assigned' | 'in_progress' | 'closed'
- Ticket priorities: 'low' | 'medium' | 'high' | 'urgent'
- User roles: 'admin' | 'agent'

**n8n Webhook Integration:**
- Webhook sent on ticket creation (fire-and-forget, errors logged but don't fail request)
- Payload: ticketId, title, email, name
- Hardcoded URL: `https://n8n.solynex.me/webhook/helpdesk-new`

## Environment Variables

Required variables (see `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup

The README.md contains complete SQL scripts for:
- Creating database tables with proper constraints
- Setting up RLS policies
- Creating indexes
- Adding triggers for automatic profile creation on user signup

When making changes to the database schema, ensure RLS policies are updated accordingly.

## Docker Deployment

Dockerfile is configured for production deployment. Environment variables must be passed at runtime.
