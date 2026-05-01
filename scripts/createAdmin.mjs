/**
 * One-time admin setup script.
 * Run with: node scripts/createAdmin.mjs
 *
 * This creates the Firebase Auth user AND writes their
 * Firestore 'staff' document with role: 'admin'.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// ─── Paste your config here (same as .env.local values) ───
const firebaseConfig = {
  apiKey:            'AIzaSyCdxJW1lZdjUW94fuj4OPbYO9R1_1sBIpk',
  authDomain:        'ehr-website-4a6bf.firebaseapp.com',
  projectId:         'ehr-website-4a6bf',
  storageBucket:     'ehr-website-4a6bf.firebasestorage.app',
  messagingSenderId: '1077162917693',
  appId:             '1:1077162917693:web:a7ca52d18096c41a774f54',
};

// ─── Staff accounts to create ─────────────────────────────
const STAFF_ACCOUNTS = [
  {
    email:       'admin1@gmail.com',
    password:    'admin1',
    displayName: 'Admin1',
    role:        'admin',
  },
  // Add more accounts here later, e.g.:
  // { email: 'doctor1@clinic.com', password: 'Doctor1!', displayName: 'Dr. Reyes', role: 'doctor' },
  // { email: 'nurse1@clinic.com',  password: 'Nurse1!',  displayName: 'Nurse Ana', role: 'nurse'  },
];
// ──────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function createStaffAccount({ email, password, displayName, role }) {
  console.log(`\nCreating: ${displayName} (${role}) — ${email}`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    await setDoc(doc(db, 'staff', cred.user.uid), {
      uid:         cred.user.uid,
      email,
      displayName,
      role,
      createdAt:   Timestamp.now(),
      active:      true,
    });

    console.log(`  ✅ Created — UID: ${cred.user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`  ⚠️  Email already in use — skipping (account may already exist).`);
    } else {
      console.error(`  ❌ Failed:`, err.message);
    }
  }
}

async function main() {
  console.log('═══ ClinixEHR Staff Account Setup ═══');
  for (const account of STAFF_ACCOUNTS) {
    await createStaffAccount(account);
  }
  console.log('\n✅ Done! You can now log in at http://localhost:5173/login');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
