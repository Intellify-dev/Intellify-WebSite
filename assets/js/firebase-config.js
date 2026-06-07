/* ============================================================
   INTELLIFY — Firebase configuration
   ------------------------------------------------------------
   This is the ONLY file you edit to connect the live database.

   1. Create a free project at https://console.firebase.google.com
   2. Add a Web app (</>) and copy its config object.
   3. Paste the values below.
   4. Set FIREBASE_ENABLED = true.

   NOTE: These web keys are NOT secrets — they are safe to upload.
   Real protection comes from Firestore Security Rules + Auth login.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBKFebYjgjZ7fwTuvaS1_yhXqPeb0OjBwk",
  authDomain: "intellify-e846f.firebaseapp.com",
  projectId: "intellify-e846f",
  storageBucket: "intellify-e846f.firebasestorage.app",
  messagingSenderId: "189149903543",
  appId: "1:189149903543:web:cd691be5eab0844433ab32",
  measurementId: "G-45C0VPQ271"
};

// Flip to true ONLY after you've pasted your real config above.
// While false, the site falls back to content.json (no live database).
window.FIREBASE_ENABLED = true;

// Where the site content lives in Firestore (collection / document).
window.FIREBASE_DOC = { collection: "site", doc: "content" };

/* ---- Email notifications for the contact form (Web3Forms — free) ----
   Every message a visitor sends is saved live to the admin dashboard AND
   emailed to your company inbox below.

   To turn the email on (one time):
   1. Go to https://web3forms.com
   2. Enter your inbox email (admin.intellify@gmail.com) → you'll receive an
      "Access Key" by email.
   3. Paste that key between the quotes below, replacing the placeholder.

   The access key is SAFE to publish — it only allows sending to YOUR verified
   inbox. Leaving the placeholder simply skips the email; messages still arrive
   on the dashboard in real time. */
window.CONTACT_INBOX_EMAIL    = "admin.intellify@gmail.com";
window.WEB3FORMS_ACCESS_KEY   = "bb753998-0f27-43a7-912a-4a56be998fbb";

// Initialise Firebase if it's enabled and the SDK loaded.
(function () {
  if (!window.FIREBASE_ENABLED) return;
  if (!window.firebase || !firebase.initializeApp) {
    console.warn('Firebase SDK not loaded — check the <script> tags.');
    window.FIREBASE_ENABLED = false;
    return;
  }
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
  } catch (e) {
    console.error('Firebase init failed', e);
    window.FIREBASE_ENABLED = false;
  }
})();
