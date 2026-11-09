# SuperArc

A modern mail and productivity app built with Next.js, React, Supabase, and Tailwind CSS.

## Features

- Gmail-style inbox with smart categories
- Supabase authentication and data sync
- Responsive UI with dark mode support
- Dashboard, overview, and assistant views

## Requirements

- Node.js 20+
- npm or pnpm
- Supabase project with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setup

```bash
npm install
# or pnpm install
```

Copy environment variables and start the app:

```bash
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - build production app
- `npm run start` - start production server
- `npm run lint` - run ESLint

## Notes

This project uses Next.js 16, React 19, Tailwind CSS, and Supabase for auth and API functionality.
