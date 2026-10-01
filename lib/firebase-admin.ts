import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

try {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codeguard-ai-22537";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (!getApps().length) {
    if (clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } else {
      // No credentials — skip Firebase Admin initialization
      console.warn("[Firebase Admin] No credentials configured. Firestore/Auth admin features disabled.");
    }
  } else {
    adminApp = getApps()[0];
  }

  if (adminApp) {
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
  }
} catch (initError) {
  console.warn("[Firebase Admin] Initialization failed, admin features disabled:", initError);
}

/**
 * Helper to safely write a document to Firestore.
 * No-ops gracefully when Firebase Admin is not configured.
 */
export async function safeFirestoreSet(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection(collection).doc(docId).set(data, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Write to ${collection}/${docId} failed:`, err);
  }
}

/**
 * Helper to safely read a document from Firestore.
 * Returns null when Firebase Admin is not configured.
 */
export async function safeFirestoreGet(
  collection: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection(collection).doc(docId).get();
    return snap.exists ? (snap.data() as Record<string, unknown>) : null;
  } catch (err) {
    console.warn(`[Firestore] Read from ${collection}/${docId} failed:`, err);
    return null;
  }
}

export { adminApp, adminDb, adminAuth };
