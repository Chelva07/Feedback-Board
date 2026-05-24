# FeedbackBoard

An anonymous feedback board app — no accounts, no logins, just honest feedback.

## What it does
- Create a named feedback board and get a shareable link
- Anyone with the link can post anonymous feedback
- Upvote posts and filter by category
- Board creator gets a secret admin key to pin or delete posts
- Email notifications on every new post
- Boards can be set to expire after 1, 7, or 30 days

## Tech Stack
- **Next.js 16** — App Router, TypeScript
- **Prisma 7** — ORM with libsql adapter
- **SQLite** (local) / **Turso** (production)
- **Resend** — email notifications
- **nanoid** — slug and admin key generation
- **Tailwind CSS** — styling

## Getting Started

### 1. Install dependencies
npm install

### 2. Set up environment variables
Create a `.env.local` file in the project root:
RESEND_API_KEY=your_resend_api_key

### 3. Run database migration
npx prisma migrate dev --name init

### 4. Start the dev server
npm run dev

Open http://localhost:3000

## Features
- No authentication — fully anonymous posting
- Admin panel protected by a secret key stored in localStorage
- Upvote deduplication per browser
- Category filtering (General, Idea, Bug, Praise, Question, Other)
- Expiry countdown badge on boards
- Email alerts via Resend on every new post