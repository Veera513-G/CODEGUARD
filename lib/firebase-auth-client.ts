import { auth, db } from "./firebase";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function loginWithFirebase(providerName: "google" | "github") {
  // If Firebase client auth is not configured, directly use server OAuth mock flow
  if (!auth) {
    try {
      const res = await fetch("/api/auth/oauth-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerName }),
      });
      const data = await res.json();
      return { ok: res.ok, data, error: data.error };
    } catch {
      return { ok: false, data: null, error: "Authentication service unavailable" };
    }
  }

  const provider =
    providerName === "google"
      ? new GoogleAuthProvider()
      : new GithubAuthProvider();

  if (providerName === "github") {
    provider.addScope("user:email");
    provider.addScope("read:user");
  }

  try {
    // Attempt Firebase Popup Sign-in for Google or GitHub
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    // Store / Sync User Profile directly in Firebase Firestore Database if db initialized
    if (db) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (providerName === "github" ? "GitHub User" : "Google User"),
            photoURL: user.photoURL || null,
            provider: providerName.toUpperCase(),
            emailVerified: user.emailVerified,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (firestoreErr) {
        console.warn("[Firestore Profile Write Notice]", firestoreErr);
      }
    }

    // Call server API to register/login session
    const res = await fetch("/api/auth/firebase-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        provider: providerName,
        email: user.email,
        name: user.displayName,
        avatarUrl: user.photoURL,
        providerId: user.uid,
      }),
    });

    const data = await res.json();
    return { ok: res.ok, data, error: data.error };
  } catch (err: any) {
    console.warn("[Firebase Client Auth Warning]", err?.message || err);

    // If client popup fails, falls back to OAuth mock route
    try {
      const res = await fetch("/api/auth/oauth-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerName }),
      });

      const data = await res.json();
      return { ok: res.ok, data, error: data.error };
    } catch {
      return { ok: false, data: null, error: "Authentication failed. Please try again." };
    }
  }
}
