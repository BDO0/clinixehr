ClinixEHR — Project Overview

ClinixEHR is a modern, responsive Electronic Health Records (EHR) & Clinical Management Web Application designed for healthcare providers, clinic staff, and patients. It combines a public-facing patient portal with an internal, role-based medical dashboard.

Core Features & Modules
1. Public Patient Portal
- Online Appointment Booking: Allows patients to schedule appointments, select doctors, and choose services.
- Secure Lookup: Patients access their booking status using unguessable 48-character tokens (`secureAppointments`), preserving privacy without exposing sensitive details.
- Teleconsultation: WebRTC video appointments integrated via randomized Jitsi Meet room URLs.
- Doctor & Service Directory: Displays available specialties, pricing, and medical staff profiles.

2. Staff Clinical Dashboard
- Role-Based Access (RBAC): Tailored dashboards and permissions for `Admin`, `Doctor`, `Nurse`, and `Staff`.
- Complete Patient Records (EHR): Full patient charts covering demographics, vitals, medical history, physical exams, immunizations, labs, orders, and discharge summaries.
- Appointments & Wait Queue: Live appointment tracking, doctor schedule conflict checks, and patient wait timers.
- Pharmacy & Safety Verification: Automated checks for drug-drug interactions and patient allergy cross-references.
- Laboratory Management: Test ordering, lab result tracking, and custom templates.
- Billing & PDF Generation: Invoice creation, payment recording, and instant PDF receipts via `jsPDF`.

Tech Stack
- Frontend: React 19 + Vite
- Styling: Tailwind CSS v4 + Lucide React icons
- Backend & Database: Firebase 12 (Authentication & Cloud Firestore)
- State Management: Zustand
- PDF & Charts: `jsPDF` + `jspdf-autotable`, `Recharts`

Security Architecture Highlights
- Zero-Trust Rules: Strict Firestore rules blocking unauthorized client-side access to clinical data.
- Atomic Operations: Double-booking prevention and multi-document status updates powered by Firebase `runTransaction` and `writeBatch`.
- Tokenized Access: Enumeration protection on public appointment lookups.

Quick Start Guide
bash
1. Install dependencies
npm install

2. Start the local development server
npm run dev
