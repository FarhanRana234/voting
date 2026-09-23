# Blossom Events — Tando Adam Eat Festival (Voting Website)

A mobile-first voting website for **Blossom Events**' Tando Adam Eat Festival. Visitors vote for
their favorite stalls in two categories; an admin manages categories, participants, vote counts and
the voting schedule from a password-protected dashboard.

Built with **Next.js 14 (App Router, TypeScript)**, **Tailwind CSS**, **Firebase Firestore**
(Admin SDK for all writes/reads of votes) and styled as a warm, floral, vintage county-fair theme.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # or fill in the existing .env.local
npm run seed                        # create the two initial categories
npm run dev                         # http://localhost:3000
```

## How voting works (public)

- The home page shows the two categories, each with a banner and participant cards (photo + name
  only). **No vote counts or rankings are ever shown to the public.**
- Each device gets a random `voterId` stored in an **httpOnly cookie** (set by middleware) *and* in
  `localStorage`. Every vote carries it; the server enforces **one vote per category per device**.
- Voting closes at the time set by the admin. After that, the same URL automatically switches from
  the voting page to the **winners page**, decided by **server time**, not the client clock.

## Admin panel

- **`/admin/login`** — password login (`ADMIN_PASSWORD`). On success the server:
  1. Sets a signed `httpOnly` session cookie (HS256, `SESSION_SECRET`).
  2. Mints a Firebase **custom auth token** with the claim `{ admin: true }` so the dashboard can
     listen live to `participantVotes` (public visitors never get this token).
- **`/admin/dashboard`** — manage categories & participants (name, photo, banner), add/remove
  entries, see **live-updating vote counts** with +/- correction buttons, and set/change the
  voting end time. All writes go through `/api/admin/*` routes (Admin SDK), never the browser SDK.

## Environment variables

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → General (public client id) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same page (pre-filled) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same page (pre-filled) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same page (pre-filled) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same page (pre-filled) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same page (pre-filled) |
| `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Console → Project settings → Service accounts → **Generate new private key** (put contents into the three vars and use `\n` for line breaks) |
| `ADMIN_PASSWORD` | Any password you choose for the admin panel |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |

`.env.local` is git-ignored. `.env.example` mirrors every variable with empty/placeholder values.

## Firebase setup (one time)

1. **Enable services** in the Firebase Console for project `voting-4e261`:
   - **Authentication** → Sign-in method → *Email/Password* (**not needed** but harmless; custom
     tokens work without it) — actually custom token sign-in works with no providers enabled.
   - **Firestore Database** → Create database (production mode).
   - **Storage** → Create storage bucket (defaults are fine).
2. **Deploy security rules** (all public writes denied; only `settings`, `categories`,
   `participants` are publicly readable; `participantVotes` readable only by the admin session):

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
   The rules live in [`firestore.rules`](./firestore.rules).

3. **Set up the Admin SDK** — Firebase Console → Project settings → Service accounts → Generate
   new private key, and put the JSON fields into the `FIREBASE_ADMIN_*` env vars.

## Firestore data model

```
settings/voting                     votingEndsAt (timestamp) — the "has voting ended?" source of truth
categories/{id}                     name, imageUrl, order
participants/{id}                   categoryId, name, photoUrl, order   (public, no counts)
participantVotes/{id}               categoryId, voteCount               (never public)
votes/{voterId_categoryId}          voterId, categoryId, participantId, createdAt
```

## API routes (server-side, Admin SDK)

| Route | Purpose |
| --- | --- |
| `POST /api/vote` | Cast a vote in a Firestore transaction (anti-double-vote + close check). Returns 200 / 409 / 403 |
| `GET /api/vote-status` | Which participants this device already voted for |
| `GET /api/voter-id` | Return the device's voter id (for localStorage sync) |
| `GET /api/results` | Winner computation (only after voting ends, computed on the server) |
| `POST /api/admin/login` / `logout` / `GET /me` / `GET /session-token` | Admin auth + custom token |
| `…/api/admin/categories` (+ `/[id]`) | List/create/rename/delete categories & banners |
| `…/api/admin/participants` (+ `/[id]`) | List/create/rename/delete participants & photos |
| `POST /api/admin/vote-adjust` | Manual +/- on a vote count (never below 0) |
| `GET|PATCH /api/admin/settings` | Read/update the voting end time |
| `POST /api/admin/upload` | Upload an image to Firebase Storage (public URL returned) |

## Images

Uploads go **only** through `POST /api/admin/upload` (Admin SDK → Firebase Storage → public URL),
then the URL is saved on the `categories`/`participants` doc. Never upload from the browser SDK
directly.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) (framework preset: **Next.js**).
3. Under *Settings → Environment Variables*, add **all** variables from `.env.local`.
4. Deploy. Optional: set the same `FIREBASE_ADMIN_*`, `ADMIN_PASSWORD`, `SESSION_SECRET` per
   preview/production environment.

## Notes

- Vote counts are visible **only** in the admin dashboard, via a live Firestore listener.
- The results page reveals winners (no raw numbers) and is also served at `/` after voting closes.
- Before the end date, `/results` shows a friendly "come back later" message.