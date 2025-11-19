# Helpdesk Application

A modern, production-ready helpdesk application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Ticket Submission**: Allow users to submit support tickets without authentication
- **Role-Based Access**: Separate dashboards for admins and agents
- **Ticket Management**: Assign tickets, set priorities, and update statuses
- **Real-time Updates**: Live ticket updates using Supabase
- **n8n Integration**: Automatic webhook notifications for new tickets
- **Docker Support**: Production-ready containerization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Icons**: Lucide React
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account
- (Optional) Docker for containerized deployment

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd helpdesk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in_progress', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for tickets
CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'agent');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Create Admin User

After setting up the tables, create an admin user:

```sql
-- First, sign up a user through Supabase Auth Dashboard or your app
-- Then update their role to admin:
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin@example.com';
```

### 4. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Usage

### Public Ticket Submission

1. Navigate to the homepage (`/`)
2. Fill out the ticket form with name, email, title, and description
3. Submit the ticket
4. A webhook will be sent to n8n at `https://n8n.solynex.me/webhook/helpdesk-new`

### Staff Login

1. Navigate to `/login`
2. Sign in with your Supabase credentials
3. Admins are redirected to `/dashboard`
4. Agents are redirected to `/dashboard/agent`

### Admin Dashboard

- View all tickets
- Filter by status (open, assigned, in_progress, closed)
- Assign tickets to agents
- Set ticket priority
- Update ticket status

### Agent Dashboard

- View only assigned tickets
- Update ticket status
- Cannot assign tickets or change priority

## Docker Deployment

### Build the Docker Image

```bash
docker build -t helpdesk-app .
```

### Run the Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  helpdesk-app
```

Or use Docker Compose:

```yaml
version: '3.8'
services:
  helpdesk:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run with:

```bash
docker-compose up -d
```

## Project Structure

```
helpdesk/
├── app/
│   ├── api/
│   │   └── tickets/
│   │       ├── route.ts          # GET/POST tickets
│   │       └── [id]/route.ts     # PATCH ticket by ID
│   ├── dashboard/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── agent/
│   │       └── page.tsx          # Agent dashboard
│   ├── login/
│   │   ├── page.tsx              # Login page
│   │   └── actions.ts            # Server actions
│   ├── layout.tsx
│   ├── page.tsx                  # Public ticket form
│   └── globals.css
├── components/
│   ├── ticket-form.tsx           # Ticket submission form
│   └── ticket-list.tsx           # Ticket management component
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   └── types.ts                  # TypeScript types
├── middleware.ts                 # Next.js middleware
├── Dockerfile
├── .dockerignore
├── .env.local.example
└── README.md
```

## API Routes

### POST /api/tickets

Create a new ticket.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Issue with login",
  "description": "Cannot log in to my account"
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "title": "Issue with login",
    "status": "open",
    "priority": "medium",
    ...
  }
}
```

### GET /api/tickets

Get all tickets (requires authentication).

**Response:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "title": "Issue with login",
      "status": "open",
      "priority": "medium",
      ...
    }
  ]
}
```

### PATCH /api/tickets/[id]

Update a ticket (requires authentication).

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assigned_to": "uuid"
}
```

## n8n Webhook Integration

When a new ticket is created, a POST request is sent to:

```
https://n8n.solynex.me/webhook/helpdesk-new
```

**Payload:**
```json
{
  "ticketId": "uuid",
  "title": "Ticket title",
  "email": "user@example.com",
  "name": "User Name"
}
```

## Security

- All routes are protected by Supabase Row Level Security (RLS)
- Authentication is handled by Supabase Auth
- Middleware validates sessions on protected routes
- Admin and agent roles are enforced at the database level

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT

## Support

For issues or questions, please open a GitHub issue or submit a support ticket through the application.
