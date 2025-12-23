```markdown
# Next + shadcn UI + Better Auth — Starter

A modern, TypeScript-first starter template for building Next.js applications using shadcn/ui (Radix + Tailwind component primitives) and Better Auth for authentication. This project is a practical starting point for production-ready apps with TypeScript, responsive UI components, and a secure, extensible auth system.

Table of contents
- About
- Key features
- Tech stack
- Prerequisites
- Getting started (local)
  - Install dependencies
  - Environment variables
  - Database (optional)
  - Start dev server
- Authentication — Better Auth
  - Setup & environment
  - Server-side session handling
  - Protecting routes & API routes
- UI — shadcn + Tailwind
- Scripts
- Deployment
- Folder structure (recommended)
- Testing & linting
- Contributing
- Troubleshooting
- License
- Acknowledgements
- Contact

---

About
-------
This repository provides a fully-typed Next.js starter built around shadcn/ui component primitives and Better Auth for authentication: opinionated, secure, and easy to extend. It's intended to speed up development of dashboards, SaaS apps, and prototypes that will migrate to production.

Key features
------------
- Next.js (TypeScript) app scaffolded with best practices
- Preconfigured shadcn/ui components + Tailwind CSS for consistent styling
- Better Auth integration for secure authentication and session management
- Environment-first configuration with clear .env examples
- Scripts for local development, build, lint, format
- Guidance for database setup and migrations (optional Prisma example)
- Ready for deployment (Vercel, Render, etc.)

Tech stack
----------
- Next.js (TypeScript)
- Tailwind CSS
- shadcn/ui (Radix + Tailwind component library)
- Better Auth for authentication
- Optional: Prisma + PostgreSQL or SQLite for persistent user data
- Tooling: ESLint, Prettier, pnpm/npm/yarn

Prerequisites
-------------
- Node.js >= 18 (recommended)
- npm, pnpm, or yarn
- Optional: PostgreSQL / MySQL / SQLite database if you need persistence
- Better Auth account or self-hosted instance and API/credentials

Getting started (local)
-----------------------

1. Clone the repository
   - git clone https://github.com/suyogangaj21/Next_shadcn_better-auth_starter.git
   - cd Next_shadcn_better-auth_starter

2. Install dependencies
   - npm install
   - or pnpm install
   - or yarn install

3. Copy environment variables
   - Create a `.env.local` at the repository root and add the variables described below.

Example .env.local
------------------
Replace values with your actual credentials and values from your Better Auth dashboard or self-hosted instance.

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="My App"

# Better Auth (example placeholders — use the exact names required by your Better Auth integration)
BETTER_AUTH_URL=https://auth.example.com
BETTER_AUTH_CLIENT_ID=your_better_auth_client_id
BETTER_AUTH_CLIENT_SECRET=your_better_auth_client_secret
BETTER_AUTH_API_KEY=your_better_auth_api_key

# If your app needs server-side cookies or secure domains
COOKIE_DOMAIN=localhost

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

Notes:
- The exact environment variable names depend on the Better Auth SDK/config you use in the project. Replace the placeholder names above with the ones your implementation expects.

4. Database (optional)
   - If you use Prisma:
     - npx prisma generate
     - npx prisma migrate dev --name init
   - If you use a hosted DB service, set DATABASE_URL accordingly.

5. Start the development server
   - npm run dev
   - or pnpm dev
   - App will be available at http://localhost:3000

Authentication — Better Auth
----------------------------

This starter integrates Better Auth as the authentication provider. The repository includes helper utilities and server routes to connect with Better Auth — configure your instance and credentials in `.env.local`.

Setup & environment
- Create a client (OAuth client or API credentials) in your Better Auth dashboard and add redirect URLs to include your app's URL (e.g., http://localhost:3000/api/auth/callback).
- Add the required credentials and endpoints to your `.env.local` (see example above).
- Install any provider SDK required by your integration (if your implementation uses an official Better Auth SDK, install it: `npm i <better-auth-sdk>`). The project may already contain the required package(s) — check package.json.

Typical server-side flow
- The app redirects users to Better Auth for sign-in (or uses the SDK to show a sign-in widget).
- After authentication, Better Auth redirects back to a callback route (e.g., /api/auth/callback) in your app.
- On the callback, your server exchanges the authorization code for tokens and creates/updates a local session.
- Persist only the minimal safe user attributes to the client (id, name, email, avatar), and keep tokens on the server or secure storage.

Server-side session handling
- Use Next.js server-side functions (getServerSideProps, middleware, or server components in the App Router) to check sessions for protected pages.
- Encapsulate session logic in a small helper (e.g., lib/auth.ts) that calls Better Auth's SDK or your token/session lookup.
- Example (pseudocode):
  - const session = await getSessionFromBetterAuth(req);
  - if (!session) redirect to signin.

Protecting API and page routes
- For API routes, call your session verification helper at the top of the route handler; return 401 if unauthenticated.
- For pages requiring auth, redirect unauthenticated visitors to the sign-in page.
- For role-based access, store role claims in your user/session object and check them on the server.

Client-side
- On the client, keep a small user context/provider that exposes the current user and a signOut function.
- Avoid storing sensitive tokens in localStorage; rely on secure, httpOnly cookies or server session IDs.

Example auth endpoints (pattern)
- GET /api/auth/signin — starts sign-in (redirect to Better Auth)
- GET /api/auth/callback — handles provider callback and creates local session
- POST /api/auth/signout — clears local session and cookies
- GET /api/auth/session — returns the current session/user (server only)

UI — shadcn + Tailwind
----------------------
This starter ships configured Tailwind CSS and shadcn/ui components.

- Tailwind config: update theme, breakpoints, or plugins in `tailwind.config.js`.
- shadcn/ui components live in a `components/` directory; use the component primitives to compose your UI.
- When adding new components via the shadcn CLI or generator, commit the new files and update the imports.

Scripts
-------
Common NPM scripts (inspect package.json for exact names):

- dev — starts Next.js in development mode
  - npm run dev
- build — builds the production app
  - npm run build
- start — runs the production server after build
  - npm run start
- lint — run ESLint
  - npm run lint
- format — run Prettier
  - npm run format
- prisma:generate — generate Prisma client (if used)
  - npm run prisma:generate
- prisma:migrate — run migrations (if used)
  - npm run prisma:migrate

Deployment
----------
This starter is well-suited for Vercel (recommended for Next.js):

1. Push repo to GitHub.
2. Import the project in Vercel (vercel.com).
3. Set your environment variables in the Vercel dashboard (BETTER_AUTH_URL, BETTER_AUTH_CLIENT_ID, BETTER_AUTH_CLIENT_SECRET, DATABASE_URL, etc.).
4. Deploy.

Notes for production:
- Ensure NEXT_PUBLIC_APP_URL (or your equivalent) points to the production domain.
- Use secure cookies for production (set cookie options to secure and sameSite=none when required over HTTPS).
- Configure redirect URLs in Better Auth to include your production domain.

Folder structure (recommended)
------------------------------
A typical layout you can follow or adapt:

- /app or /pages — Next.js routes (depending on Pages vs App Router)
- /components — UI components (shadcn-based)
- /lib — utilities (auth helpers, API clients)
- /styles — global styles, tailwind config
- /prisma — Prisma schema and migrations (optional)
- /public — static assets
- /tests — unit/integration tests

Testing & linting
-----------------
- Unit tests: Jest / Vitest (if included)
  - Example: npm run test
- End-to-end: Playwright / Cypress (if included)
- Lint: npm run lint
- Format: npm run format

Contributing
------------
Contributions are welcome. A suggested workflow:

1. Fork the repo
2. Create a feature branch: git checkout -b feat/my-feature
3. Commit changes with clear messages
4. Push and open a PR to the main repository
5. Ensure CI passes (lint, tests) and add docs as needed

For large changes, open an issue first to discuss the design.

Troubleshooting
---------------
- "Auth callback not working": confirm callback/redirect URLs in Better Auth and that BETTER_AUTH_URL / client credentials match your provider settings.
- "Database connection refused": verify DATABASE_URL and that database is running/accessible.
- "Tailwind classes not applied": ensure tailwind.config.js content paths include all component and page paths.
- "Session not persisting": ensure cookies are being set correctly and cookie domain/sameSite/secure values are appropriate for your environment.

License
-------
Add your license of choice (MIT recommended for starters). Example:

MIT © [Your Name or Organization]

Acknowledgements
----------------
- shadcn/ui — component primitives and design system
- Tailwind CSS — utility-first styling
- Next.js — React framework for production
- Better Auth — authentication provider used in this starter

Contact
-------
Maintainer: suyogangaj21
Repo: https://github.com/suyogangaj21/Next_shadcn_better-auth_starter

---

If you'd like, I can now:
- Scan your repository to extract the exact Better Auth SDK name, environment variable names, and callback routes to replace the placeholders in this README and commit it.
- Open a PR that adds this README to the repo with exact values (if you confirm the variable names or allow me to read the repo).
```
``` 

What's next: I can scan your repo and update the README with exact SDK/package names and env variables from your code, and then open a PR to add the file — shall I proceed?
