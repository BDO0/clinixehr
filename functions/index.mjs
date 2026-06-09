/**
 * ClinixEHR Cloud Functions — Book Appointment
 * 
 * This Callable Function handles the entire appointment booking flow:
 * 1. Validates input
 * 2. Resolves patient identity (lookup existing or create new)
 * 3. Checks for conflicts (patient duplicate, doctor overlap)
 * 4. Creates appointment + secureAppointments atomically
 * 
 * Admin SDK bypasses Firestore rules, allowing reads to patients/appointments
 * collections that are normally restricted to authenticated staff.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as crypto from 'crypto';

initializeApp();
const db = getFirestore();

// ── Helpers ──

function generateLookupToken() {
  return crypto.randomBytes(24).toString('hex'); // 48 hex chars, 192 bits
}

function generateRoomPassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomBytes(16), byte => charset[byte % charset.length]).join('');
}

function generateJitsiRoomName() {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `clinixehr-${randomPart}-${timePart}`;
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function parseTimeToDate(dateStr, timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  if (modifier === 'PM' && h !== 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
}

function validatePhone(phone) {
  return /^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, ''));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Main Booking Function ──

export const bookAppointment = onCall(
  {
    cors: true,
    maxInstances: 10,
    minInstances: 0,
    region: 'us-central1',
    secrets: [], // No secrets needed — admin SDK uses default credentials
  },
  async (request) => {
    logger.info('bookAppointment called', { request: request.data });

    const data = request.data;

    // ── Validate required fields ──
    if (!data.patientName?.trim()) {
      throw new HttpsError('invalid-argument', 'Full name is required.');
    }
    if (!data.patientPhone?.trim()) {
      throw new HttpsError('invalid-argument', 'Phone number is required.');
    }
    const phoneClean = data.patientPhone.replace(/\s/g, '');
    if (!validatePhone(phoneClean)) {
      throw new HttpsError('invalid-argument', 'Enter a valid PH mobile number (e.g., 09171234567).');
    }
    if (data.patientEmail && !validateEmail(data.patientEmail)) {
      throw new HttpsError('invalid-argument', 'Enter a valid email address.');
    }
    if (!data.date || !data.time) {
      throw new HttpsError('invalid-argument', 'Date and time are required.');
    }

    const scheduledAt = parseTimeToDate(data.date, data.time);
    const duration = 30;
    const endTime = new Date(scheduledAt.getTime() + duration * 60000);
    const apptType = data.type || 'Consultation';
    const apptPrice = apptType === 'Teleconsult' ? 500 : 800;

    // ── Generate security tokens ──
    const lookupToken = generateLookupToken();
    const roomPassword = apptType === 'Teleconsult' ? generateRoomPassword() : '';
    const jitsiRoomName = apptType === 'Teleconsult' ? generateJitsiRoomName() : '';
    const jitsiLink = apptType === 'Teleconsult' ? `https://meet.jit.si/${jitsiRoomName}` : '';

    // ── Transaction: resolve patient + check conflicts + create documents ──
    const result = await db.runTransaction(async (transaction) => {
      // ── Step 1: Resolve patient identity ──
      let patientId = null;

      if (data.patientEmail) {
        const emailSnap = await transaction.get(
          db.collection('patients').where('email', '==', data.patientEmail)
        );
        if (!emailSnap.empty) {
          patientId = emailSnap.docs[0].id;
        }
      }

      if (!patientId && data.patientPhone) {
        const phoneSnap = await transaction.get(
          db.collection('patients').where('phone', '==', phoneClean)
        );
        if (!phoneSnap.empty) {
          patientId = phoneSnap.docs[0].id;
        }
      }

      // Create new patient if not found — inside transaction
      if (!patientId) {
        const newPatientRef = db.collection('patients').doc();
        const nameParts = data.patientName.trim().split(/\s+/);
        const firstName = nameParts[0] || data.patientName;
        const lastName = nameParts.slice(1).join(' ') || '';

        transaction.set(newPatientRef, {
          firstName,
          lastName,
          email: data.patientEmail || '',
          phone: phoneClean,
          source: 'public-booking',
          createdAt: new Date(),
          createdBy: 'public',
          deleted: false,
        });
        patientId = newPatientRef.id;
      }

      // ── Step 2: Check patient duplicate ──
      const patientAppts = await transaction.get(
        db.collection('appointments').where('patientId', '==', patientId)
      );

      let hasPatientConflict = false;
      patientAppts.forEach(doc => {
        if (hasPatientConflict) return;
        const a = doc.data();
        if (a.status === 'cancelled') return;
        const aStart = a.scheduledAt?.toDate?.();
        if (!aStart) return;
        if (!sameDay(aStart, scheduledAt)) return;
        if (Math.abs(aStart.getTime() - scheduledAt.getTime()) < 30 * 60 * 1000) {
          hasPatientConflict = true;
        }
      });

      if (hasPatientConflict) {
        throw new HttpsError('already-exists', 'You already have a booking within this time slot.');
      }

      // ── Step 3: Check doctor conflict ──
      if (data.doctor) {
        const doctorAppts = await transaction.get(
          db.collection('appointments').where('doctor', '==', data.doctor)
        );

        let hasDoctorConflict = false;
        doctorAppts.forEach(doc => {
          if (hasDoctorConflict) return;
          const a = doc.data();
          if (a.status === 'cancelled') return;
          const aStart = a.scheduledAt?.toDate?.();
          if (!aStart) return;
          if (!sameDay(aStart, scheduledAt)) return;
          const aEnd = a.endTime?.toDate?.() || new Date(aStart.getTime() + (a.duration || 30) * 60000);
          if (timesOverlap(scheduledAt, endTime, aStart, aEnd)) {
            hasDoctorConflict = true;
          }
        });

        if (hasDoctorConflict) {
          throw new HttpsError('aborted', 'This doctor is already booked during this time.');
        }
      }

      // ── Step 4: Create appointment document ──
      const apptRef = db.collection('appointments').doc();
      const secureApptRef = db.collection('secureAppointments').doc(lookupToken);

      transaction.set(apptRef, {
        patientName: data.patientName.trim(),
        patientId: patientId,
        patientEmail: data.patientEmail || '',
        patientPhone: phoneClean,
        reason: data.reason || `${apptType} appointment`,
        type: apptType,
        doctor: data.doctor || '',
        doctorName: data.doctorName || '',
        status: 'pending',
        scheduledAt: scheduledAt,
        endTime: endTime,
        duration: duration,
        room: apptType === 'Teleconsult' ? 'Telehealth' : 'General',
        amount: apptPrice,
        source: 'public-booking',
        createdAt: new Date(),
        notes: data.notes || '',
        arrivedAt: null,
        lookupToken: lookupToken,
        teleconsultLink: jitsiLink,
        teleconsultEnabled: apptType === 'Teleconsult',
        teleconsultPassword: apptType === 'Teleconsult' ? roomPassword : '',
        teleconsultRoomName: apptType === 'Teleconsult' ? jitsiRoomName : '',
      });

      // ── Step 5: Create secureAppointments entry for public lookup ──
      transaction.set(secureApptRef, {
        appointmentId: apptRef.id,
        patientName: data.patientName.trim(),
        patientEmail: data.patientEmail || '',
        patientPhone: phoneClean,
        type: apptType,
        doctorName: data.doctorName || '',
        status: 'pending',
        scheduledAt: scheduledAt,
        endTime: endTime,
        duration: duration,
        reason: data.reason || '',
        teleconsultLink: jitsiLink,
        teleconsultEnabled: apptType === 'Teleconsult',
        teleconsultRoomName: apptType === 'Teleconsult' ? jitsiRoomName : '',
        createdAt: new Date(),
        bookingRef: apptRef.id,
      });

      return {
        bookingRef: apptRef.id,
        lookupToken: lookupToken,
        teleconsultLink: jitsiLink,
        teleconsultPassword: roomPassword,
        scheduledAt: scheduledAt.toISOString(),
        type: apptType,
        doctorName: data.doctorName || '',
        patientName: data.patientName.trim(),
        date: data.date,
        time: data.time,
      };
    });

    logger.info('Booking successful', { bookingRef: result.bookingRef });
    return { success: true, ...result };
  }
);