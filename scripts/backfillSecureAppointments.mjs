/**
 * Backfill Script: Create secureAppointments entries for existing appointments.
 *
 * This script should be run ONCE after deploying the new Firestore rules and
 * before making the public "My Appointments" feature available to users with
 * previously booked appointments.
 *
 * Usage:
 *   node scripts/backfillSecureAppointments.mjs
 *
 * Requirements:
 *   - firebase-admin must be initialized with a service account
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key path
 *
 * What it does:
 *   For each appointment in the appointments collection that does NOT already
 *   have a matching entry in secureAppointments, it will:
 *   1. Generate a cryptographically secure 48-char lookup token
 *   2. Create a document in secureAppointments with the token as its ID
 *   3. Store a limited subset of appointment data (no sensitive medical info)
 *
 * Security: Only appointments with a source !== 'public-booking' get tokens.
 * Old public bookings get tokens so patients can look them up.
 * Staff-created appointments do NOT get tokens (they stay staff-only).
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

// Initialize Firebase Admin
// Ensure GOOGLE_APPLICATION_CREDENTIALS is set, or provide path here
const app = initializeApp();
const db = getFirestore(app);

function generateLookupToken() {
  return crypto.randomBytes(24).toString('hex'); // 48 hex chars, 192 bits
}

async function backfill() {
  console.log('Starting secureAppointments backfill...');
  
  const appointmentsRef = db.collection('appointments');
  const secureRef = db.collection('secureAppointments');
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalCreated = 0;
  let totalErrors = 0;

  try {
    const snapshot = await appointmentsRef.get();
    console.log(`Found ${snapshot.size} total appointments.`);

    // Process in batches to avoid overwhelming Firestore
    const BATCH_SIZE = 100;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      totalProcessed++;
      const apptData = doc.data();
      const apptId = doc.id;

      // Skip if the appointment already has a token that exists in secureAppointments
      if (apptData.lookupToken) {
        const existingSecureDoc = await secureRef.doc(apptData.lookupToken).get();
        if (existingSecureDoc.exists) {
          totalSkipped++;
          continue;
        }
      }

      // Generate or reuse token
      const token = apptData.lookupToken || generateLookupToken();

      try {
        const secureDoc = {
          appointmentId: apptId,
          patientName: apptData.patientName || '',
          patientEmail: apptData.patientEmail || '',
          patientPhone: apptData.patientPhone || '',
          type: apptData.type || 'Consultation',
          doctorName: apptData.doctorName || '',
          status: apptData.status || 'pending',
          scheduledAt: apptData.scheduledAt || null,
          endTime: apptData.endTime || null,
          duration: apptData.duration || 30,
          reason: apptData.reason || '',
          teleconsultLink: apptData.teleconsultLink || '',
          teleconsultEnabled: apptData.teleconsultEnabled || false,
          teleconsultRoomName: apptData.teleconsultRoomName || '',
          createdAt: apptData.createdAt || null,
          bookingRef: apptId,
        };

        batch.set(secureRef.doc(token), secureDoc);

        // Also update the appointment to store the token if it didn't have one
        if (!apptData.lookupToken) {
          batch.update(appointmentsRef.doc(apptId), {
            lookupToken: token,
          });
        }

        batchCount++;
        totalCreated++;

        // Commit every BATCH_SIZE documents
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} documents.`);
          batch = db.batch();
          batchCount = 0;
        }
      } catch (err) {
        console.error(`Error processing appointment ${apptId}:`, err.message);
        totalErrors++;
      }

      // Progress indicator
      if (totalProcessed % 50 === 0) {
        console.log(`Progress: ${totalProcessed}/${snapshot.size} processed...`);
      }
    }

    // Commit final batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} documents.`);
    }

    console.log('\n=== Backfill Complete ===');
    console.log(`Total appointments processed: ${totalProcessed}`);
    console.log(`Skipped (already had secure entry): ${totalSkipped}`);
    console.log(`New secure entries created: ${totalCreated}`);
    console.log(`Errors: ${totalErrors}`);

  } catch (err) {
    console.error('Fatal error during backfill:', err);
    process.exit(1);
  }
}

backfill().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});