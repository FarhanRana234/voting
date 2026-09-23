# Build Prompt: "Blossom Events – Tando Adam Eat Festival" Voting Website

Use this prompt as-is with your AI coding assistant (Claude Code, Cursor, etc.) to scaffold the project.

---

## 1. Project Summary

Build a mobile-first voting website for **"Blossom Events" – the Tando Adam Eat Festival**. Visitors vote for their favorite participants in two categories; an admin manages categories, participants, and vote counts from a password-protected dashboard.

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Backend logic:** Next.js Route Handlers (API routes) using the **Firebase Admin SDK** — do NOT run vote/admin writes from the client SDK directly, so double-vote prevention and admin auth can't be bypassed by editing client code.
- **Hosting:** Vercel
- **Vote persistence / anti-duplicate voting:** a random UUID generated on first visit, stored in `localStorage` **and** as a long-lived `httpOnly` cookie (cookie is the source of truth since localStorage can be cleared/spoofed more easily; use both so the UX still recognizes a returning voter even if one is cleared). This `voterId` is sent with every vote request and recorded server-side.

## 3. Visual Design Direction (from the attached flyer)

Recreate the flyer's aesthetic as a cohesive web theme — this is a floral, vintage/rustic county-fair look, not a generic SaaS UI:

- **Palette:** blush/dusty pink (`#e8a0ab`-ish for accents, `#d16b82`-ish for headings), sage/olive green (`#5c6e4a`-ish), cream/ivory background (`#faf3ee`-ish), white cards.
- **Typography:** an elegant script font for the "Blossom Events" logo/wordmark (e.g., Google Font "Alex Brush" or "Sacramento"), a bold rounded display font for big headers like "EAT FESTIVAL" (e.g., "Fredoka" or "Baloo 2"), and a clean sans-serif for body text (e.g., "Poppins" or "Nunito").
- **Motifs:** soft floral corner illustrations/borders (SVG or PNG watercolor-style flowers can be used as decorative corner/background elements), a gingham-ribbon accent color used sparingly, small heart/star dividers, rounded "banner" shapes for category labels (like the green ribbon banner in the flyer), and rounded plaque/badge shapes (like the pink "DM for booking" plaque) for buttons/cards.
- **Feel:** warm, handwritten, celebratory — generous whitespace, soft shadows, rounded corners (16–24px), no harsh corporate colors.
- Header of the site should echo the flyer layout: "Blossom Events" script logo → "Tando Adam" bold headline → "Eat Festival — Vote for your favorites!" tagline.

## 4. Voting Flow (Public Pages)

- Landing/voting page shows **two categories** (tabs or stacked sections), each with its own **category image/banner** at the top (see Section 6 for where this is stored) and its participants as cards (photo + name only — **no vote counts, no percentages, no rankings visible to the public, ever, before or during voting**).
- Each participant card has a **Vote** button.
- On vote:
  1. Client sends `{ voterId, categoryId, participantId }` to `POST /api/vote`.
  2. Server checks (in a Firestore transaction) whether this `voterId` has already voted in this `categoryId`, and whether voting is still open (current time < `votingEndsAt`).
  3. If not voted yet and voting is open: increment the participant's `voteCount` in `participantVotes/{participantId}`, write a `votes/{voterId}_{categoryId}` doc marking it used, return success.
  4. If already voted: return 409 and the client disables/greys out that category's buttons and shows "You've already voted in this category" (it can show *which* participant they picked, from the same marker doc, but never counts).
  5. If voting has closed: return 403 and redirect/prompt the user to the Results page (Section 4a).
- **One vote per category per device** (a device can vote once in Category A and once in Category B — but never twice in the same category), and the "already voted" state must persist across refresh/reopening the site (via the cookie/localStorage `voterId`).
- No login required for regular visitors.
- While voting is open, show a small themed countdown ("Voting closes in 2d 4h 12m") sourced from `votingEndsAt` (Section 5).

## 4a. Voting-Ends / Winners Page

- Route: `/results` (also auto-shown in place of the voting page once `votingEndsAt` has passed — the same URL should switch itself from "vote" mode to "results" mode automatically based on server time, not the client's clock).
- Once voting has ended, this page reveals, **for the first time to any visitor**, the winner of each category (highest vote count; participant photo + name), styled as a celebratory "winners" reveal in the site's floral/vintage theme:
  - A themed banner/header, e.g. "🌸 And the winners are... 🌸" using the same script/display fonts as the flyer.
  - Each category shown as a card/section with its category image, its winning participant highlighted (larger photo, a ribbon/badge/crown-style graphic in the pink/sage palette, subtle confetti or floating-petal animation, a soft "reveal" animation on page load — e.g. fade + scale-in, or a short flip/unwrap effect — rather than a static screenshot-like layout).
  - Runner-ups (2nd/3rd place) can optionally be listed smaller below the winner, still with no raw vote numbers shown to the public unless you decide later to reveal them.
  - Keep the countdown/voting UI completely hidden here; this page never lets you vote again.
- Before `votingEndsAt`, visiting `/results` directly should show a friendly "Voting is still open — come back after [formatted end date/time] to see the winners" message with a link back to the voting page.
- Since `participantVotes` is not publicly readable, the winner computation happens **server-side**: `GET /api/results` checks `votingEndsAt` has passed, reads `participantVotes` with the Admin SDK, joins it with `participants`/`categories`, and returns just `{ categoryName, categoryImage, winner: { name, photoUrl }, runnerUps: [...] }` — still no raw numbers sent to the client unless you decide to add that later.

## 5. Admin Panel

- Route: `/admin` (or `/admin/login` → `/admin/dashboard`).
- **Auth:** a single admin password set as an environment variable (`ADMIN_PASSWORD`, never exposed to the client). Login form posts to `/api/admin/login`, which checks the password server-side and, on success:
  1. Sets a signed/`httpOnly` session cookie (JWT or random token stored server-side with an expiry) — used to authorize all `/api/admin/*` route handlers.
  2. Also mints a **Firebase custom auth token** via the Admin SDK with a custom claim `{ admin: true }`, and returns it to the client, which signs in with `signInWithCustomToken`. This lets the admin dashboard use a **live `onSnapshot` listener directly on `participantVotes`** (see Section 6/7) for real-time counts, while normal visitors — who are never signed in — stay blocked by the security rules below.
  - All `/api/admin/*` route handlers must check the session cookie before doing anything, regardless of the custom-token listener.
- **Dashboard capabilities:**
  - **Categories:** view both categories; rename them; change/upload each category's **banner image**; (optionally) allow adding/removing categories if you want more than 2 later, but ship with exactly 2 by default.
  - **Participants:** within each category — add a new participant (name + photo), remove a participant, edit a participant's name, and **change/replace their photo** at any time.
  - **Votes:** the dashboard is the *only* place vote counts are ever visible. Show a **live-updating** vote count per participant (via Firestore `onSnapshot`, so counts change in real time as votes come in, no refresh needed), sorted so the current leader in each category is obvious at a glance. Each participant also has **+ / −** buttons to manually increase or decrease their count (server-validated, can't go below 0).
  - **Voting schedule:** a date + time picker to set `votingEndsAt` (store as a UTC timestamp; display/edit in the admin's local timezone). Admin can change this at any time, including re-opening voting by pushing the date forward again after it has passed.
  - Changes should reflect on the public voting page in real time or on next load (Firestore `onSnapshot` listeners are fine for this).
- Image uploads (both participant photos and category banners) go to **Firebase Storage** via an admin-only API route (using the Admin SDK), which returns the public URL to save on the `participants`/`categories` doc — don't let the browser upload directly to Storage without going through your authenticated route.
- Keep the admin UI functional/simple (still on-brand, but clarity over decoration — it's a management tool).

## 6. Firestore Data Model

```
settings/voting
  - votingEndsAt: timestamp        // single source of truth for "has voting ended?"

categories/{categoryId}
  - name: string
  - imageUrl?: string              // category banner image, admin-editable
  - order: number

participants/{participantId}       // PUBLIC fields only — never put voteCount here
  - categoryId: string
  - name: string
  - photoUrl?: string              // admin-editable at any time
  - order: number

participantVotes/{participantId}   // separate doc, NOT publicly readable, keeps counts out of reach of normal users
  - categoryId: string
  - voteCount: number

votes/{voterId_categoryId}     // doc ID = `${voterId}_${categoryId}`, enforces one vote per category per device
  - voterId: string
  - categoryId: string
  - participantId: string
  - createdAt: timestamp

adminSessions/{sessionToken}    // only if not using a JWT
  - createdAt: timestamp
  - expiresAt: timestamp
```

## 7. Firestore Security Rules

Since all writes go through server-side API routes using the **Firebase Admin SDK** (which bypasses security rules), lock the database down to public writes entirely. Public reads are allowed only for `settings` (countdown), `categories`, and `participants` (name/photo only — no vote counts). `participantVotes` is readable only by an authenticated admin session; everything else is denied to everyone:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/{docId} {
      allow read: if true;   // needed publicly for the countdown / open-vs-closed check
      allow write: if false; // set only via Admin SDK
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if false; // writes only via Admin SDK / server routes
    }
    match /participants/{participantId} {
      allow read: if true;   // public fields only — no voteCount lives here
      allow write: if false;
    }
    match /participantVotes/{participantId} {
      // vote counts are NEVER visible to normal visitors — only the signed-in admin session
      // (custom claim set when the admin logs in, see Section 5) may read this collection.
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if false; // counts only change via Admin SDK in /api routes
    }
    match /votes/{voteId} {
      allow read, write: if false; // never exposed to client directly
    }
    match /adminSessions/{sessionId} {
      allow read, write: if false;
    }
  }
```

## 8. Environment Variables (Vercel)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` (from a Firebase **service account** JSON — generate this in Firebase Console → Project Settings → Service Accounts; needed for the Admin SDK used in API routes)
- `ADMIN_PASSWORD` (the admin panel password)
- `SESSION_SECRET` (random string for signing the admin session token)

My Firebase web config (for the `NEXT_PUBLIC_*` values above):

```js
const firebaseConfig = {
  apiKey: "api_key_here",
  authDomain: "voting-4e261.firebaseapp.com",
  projectId: "voting-4e261",
  storageBucket: "voting-4e261.firebasestorage.app",
  messagingSenderId: "829554248701",
  appId: "1:829554248701:web:fdc6d2768065f144dc6794"
};
```

(Note: this `apiKey` is a public client identifier, not a secret — it's safe to expose in frontend code as usual for Firebase web apps. The actual secret is the **service account** key used server-side for the Admin SDK, plus `ADMIN_PASSWORD`.)

## 9. .env Setup

Generate a `.env.local` (and a matching `.env.example`) file listing **every** variable from Section 8, pre-filled where the value is already known, and left blank only for what I still need to fill in myself:

- Pre-fill these (already provided above): `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
- Generate a random, sufficiently long value automatically for: `SESSION_SECRET`.
- Leave blank with a comment on where to get each one, since these are things only I can supply: `NEXT_PUBLIC_FIREBASE_API_KEY` (from Firebase Console → Project settings → General), `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` (from a generated service account JSON, Firebase Console → Project settings → Service accounts), and `ADMIN_PASSWORD` (my chosen admin panel password).
- Make sure `.env.local` is in `.gitignore` so none of this gets committed, and that `.env.example` mirrors the same variable names with empty/placeholder values so the setup is reproducible.

## 10. Deliverables

1. Next.js project with the pages/routes above.
2. `.env.local` and `.env.example` as described in Section 9.
3. Seed script or admin UI flow to create the initial 2 categories.
4. `README.md` covering local setup, environment variables, and Vercel deployment steps.
5. Responsive design (mobile-first, since most voters will use phones).

## 11. Out of Scope (unless you want to add it later)

- Social login / real user accounts
- Email notifications
- Multi-admin roles/permissions
- Analytics dashboard beyond raw vote counts
