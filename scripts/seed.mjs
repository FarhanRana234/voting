// Seed script: creates the initial 2 categories plus a few sample participants.
// Run with:  npm run seed
// Requires the FIREBASE_ADMIN_* environment variables from .env.local to be set.
import dotenv from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

dotenv.config({ path: ".env.local" });

const CATEGORIES = [
  { name: "Sweet & Desserts", order: 0 },
  { name: "Savory & Street Food", order: 1 },
];

const SAMPLE_PARTICIPANTS = {
  "Sweet & Desserts": [
    "Gulab Jamun Corner",
    "Jalebi & Meetha House",
    "Halva Special Stall",
  ],
  "Savory & Street Food": [
    "Chargha Master",
    "Chaat Kings",
    "Biryani Bhai",
  ],
};

function creds() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "[seed] Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY in .env.local"
    );
    process.exit(1);
  }
  return { projectId, clientEmail, privateKey };
}

async function main() {
  initializeApp({ credential: cert(creds()) });
  const db = getFirestore();

  const existing = await db.collection("categories").limit(1).get();
  if (!existing.empty) {
    console.log("[seed] Categories already exist — skipping. (Delete them in Firestore to re-seed.)");
    return;
  }

  const batch = db.batch();

  const created = {};
  for (const cat of CATEGORIES) {
    const ref = db.collection("categories").doc();
    created[cat.name] = ref.id;
    batch.set(ref, { name: cat.name, imageUrl: null, order: cat.order });
    console.log(`[seed] Category ${cat.name} -> ${ref.id}`);
  }

  for (const [catName, names] of Object.entries(SAMPLE_PARTICIPANTS)) {
    const categoryId = created[catName];
    let i = 0;
    for (const name of names) {
      const ref = db.collection("participants").doc();
      batch.set(ref, { categoryId, name, photoUrl: null, order: i });
      batch.set(db.doc(`participantVotes/${ref.id}`), { categoryId, voteCount: 0 });
      console.log(`[seed] Participant ${name} -> ${ref.id}`);
      i += 1;
    }
  }

  await batch.commit();
  console.log("[seed] Done. Now set a closing time via the admin dashboard:");
  console.log("[seed]   /admin -> Voting schedule");
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});