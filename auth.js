/* Lygo's Land — accounts and sync.
   Loaded as <script type="module"> AFTER profiles.js.

   WHAT SYNCS: profiles, playtime, favourites, recently-played.
   WHAT DOESN'T: ROM files and BIOS files. Those stay on your device.
   That's deliberate — uploading game files would need Firebase Cloud
   Storage, which since Feb 2026 requires a billing account, and it would
   mean hosting copyrighted files on a server. Local-only keeps this free
   and keeps your files yours.

   Sign-in is OPTIONAL. Everything works signed out; signing in just makes
   your profiles follow you to another device.
*/

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, deleteUser
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
  collection, addDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* Publishable by design. The apiKey is a project identifier, not a secret —
   it ships in the page source of every Firebase site. Access is controlled
   by the Firestore security rules, not by hiding this. */
const firebaseConfig = {
  apiKey: "AIzaSyCzRMMoPp1wraFImvw4HSHpPyQFaANm0kQ",
  authDomain: "lygolandsite.firebaseapp.com",
  projectId: "lygolandsite",
  storageBucket: "lygolandsite.firebasestorage.app",
  messagingSenderId: "1050727302609",
  appId: "1:1050727302609:web:1ae73a9b8245239e700cf0"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUser = null;
let pushTimer = null;

/* ---------------------------------------------------------------------- */

function userDoc(uid) { return doc(db, "users", uid); }

/* Pull the cloud copy and merge it into whatever is on this device. */
async function pull() {
  if (!currentUser) return { ok: false };
  try {
    const snap = await getDoc(userDoc(currentUser.uid));
    if (!snap.exists()) return { ok: true, changed: false, first: true };
    const remote = snap.data();
    const res = window.Lygo.mergeRemote({
      profiles: remote.profiles || [],
      activeId: remote.activeId || null
    });
    return { ok: true, changed: res.changed };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/* Push the local copy up. Debounced — profile edits can fire in bursts. */
async function push(immediate) {
  if (!currentUser) return { ok: false };
  clearTimeout(pushTimer);
  const run = async function () {
    try {
      const local = window.Lygo.dump();
      await setDoc(userDoc(currentUser.uid), {
        profiles: local.profiles || [],
        activeId: local.activeId || null,
        updated: serverTimestamp(),
        schema: 2
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  if (immediate) return run();
  pushTimer = setTimeout(run, 1500);
  return { ok: true, queued: true };
}

/* Pull then push, so both sides end up holding the merged result. */
async function syncNow() {
  const p = await pull();
  if (!p.ok) return p;
  return push(true);
}

/* ---------------------------------------------------------------------- */

const LygoAuth = {
  user: function () { return currentUser; },

  signUp: async function (email, password) {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      await syncNow();                       // seed the cloud with local profiles
      return { ok: true };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  },

  signIn: async function (email, password) {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncNow();
      return { ok: true };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  },

  signOut: async function () {
    try {
      await push(true);                      // don't lose unsynced edits
      await signOut(auth);
      return { ok: true };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  },

  reset: async function (email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  },

  /* Removes the cloud copy and the account. Local profiles are untouched —
     deleting an account shouldn't wipe the games on your own machine. */
  deleteAccount: async function () {
    if (!currentUser) return { ok: false, error: "Not signed in." };
    try {
      await deleteDoc(userDoc(currentUser.uid));
      await deleteUser(currentUser);
      return { ok: true };
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        return { ok: false, error: "For safety, sign out and back in, then delete." };
      }
      return { ok: false, error: friendly(e) };
    }
  },

  syncNow: syncNow,
  push: push,
  onChange: function (fn) { listeners.push(fn); if (ready) fn(currentUser); },

  /* Mailing list. Separate from accounts on purpose — plenty of people will
     want news without creating a login, and forcing an account to hear about
     updates is a bad trade.

     Writes to a `signups` collection that is create-only: nobody, signed in
     or not, can read it back from the client. The list is visible to you in
     the Firebase console. */
  subscribe: async function (name, email) {
    const e = String(email || "").trim();
    const n = String(name || "").trim();
    if (!n) return { ok: false, error: "Enter your name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
      return { ok: false, error: "That doesn't look like an email address." };
    }
    if (e.length > 200 || n.length > 80) {
      return { ok: false, error: "That's longer than expected — check it over." };
    }
    try {
      await addDoc(collection(db, "signups"), {
        name: n.slice(0, 80),
        email: e.slice(0, 200).toLowerCase(),
        created: serverTimestamp(),
        uid: currentUser ? currentUser.uid : null
      });
      return { ok: true };
    } catch (err) {
      if (err.code === "permission-denied") {
        return { ok: false, error: "Signups aren't switched on yet. Try again later." };
      }
      return { ok: false, error: friendly(err) };
    }
  }
};

function friendly(e) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-email": "That doesn't look like an email address.",
    "auth/weak-password": "Password needs to be at least 6 characters.",
    "auth/invalid-credential": "Email or password is wrong.",
    "auth/wrong-password": "Email or password is wrong.",
    "auth/user-not-found": "No account with that email.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "auth/network-request-failed": "Couldn't reach the server. Check your connection."
  };
  return map[e.code] || (e.message || "Something went wrong.");
}

const listeners = [];
let ready = false;

onAuthStateChanged(auth, function (u) {
  currentUser = u;
  ready = true;
  listeners.forEach(function (fn) { fn(u); });
  renderBadge();
  if (u) pull();
});

/* Small "signed in as" line, wherever #authbadge exists. */
function renderBadge() {
  const el = document.getElementById("authbadge");
  if (!el) return;
  el.textContent = "";
  const link = document.createElement("a");
  link.href = "account.html";
  if (currentUser) {
    link.textContent = currentUser.email;
    el.append("Synced \u00B7 ", link);
  } else {
    link.textContent = "sign in to sync";
    el.append("Local only \u00B7 ", link);
  }
  el.hidden = false;
}

document.addEventListener("DOMContentLoaded", renderBadge);

/* Push whenever profiles change locally. Cheap: debounced, and a no-op
   when signed out. */
window.addEventListener("pagehide", function () { if (currentUser) push(true); });

window.LygoAuth = LygoAuth;
export default LygoAuth;
