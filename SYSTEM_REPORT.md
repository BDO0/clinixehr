# ClinixEHR — Complete System Understanding Report

> **Generated:** 2026-06-08  
> **Audience:** New developers, auditors, AI agents inheriting the codebase  
> **Status:** Working MVP — deployed on Vercel, Firebase backend  

---

## 1. Executive Summary

### What the System Does
ClinixEHR is an **internal Electronic Health Record (EHR) system** for small-to-medium clinical settings. It allows clinical staff (doctors, nurses, admin, reception staff) to manage patients, schedule appointments, record vitals and examinations, order labs and prescriptions, process billing, and track immunizations — all through a single responsive web application.

### Who the Users Are
| Role | Capabilities |
|------|-------------|
| **Admin** | Full access: manage staff, patients, clinical records, labs, pharmacy, appointments, billing |
| **Doctor** | Clinical core: examine patients, prescribe medications, order labs, manage appointments, view billing |
| **Nurse** | Clinical support: record vitals, document exams, manage labs, administer immunizations |
| **Staff** (Reception) | Administrative: register patients, schedule appointments, manage billing |

### Main Business Goals
1. Replace paper-based patient records with a digital, real-time system
2. Prevent adverse drug events through built-in interaction checking
3. Streamline clinic workflows (patient registration → appointment → exam → prescription → billing)
4. Provide role-appropriate access so only authorized staff see clinical data

### Key Features
- **Role-Based Access Control (RBAC):** Every route, action, and UI element is gated by role
- **Real-time Data:** Firestore `onSnapshot` listeners keep all views live
- **Drug Safety Engine:** 28 built-in drug-drug interactions + allergy cross-reference + override justification workflow
- **Appointment Management:** Scheduling with conflict detection, live queue with wait timers, auto-billing/exam-note creation on completion
- **Laboratory Module:** Panel-based lab templates (CBC, BMP, CMP, Lipid Panel, etc.) with auto-billing
- **Vitals & Exam Trends:** Recharts-powered line charts for vitals and lab result trends
- **Patient History Hub:** Past medical, surgical, family, and social history with inline editing
- **Dark Mode:** Custom SVG eyelid transition animation
- **Offline Persistence:** Firestore IndexedDB cache for offline-first operation
- **Admin Script:** One-command staff account bootstrapping

---

## 2. System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  React 19  │  │  Zustand     │  │  Tailwind CSS 4        │  │
│  │  (Vite)    │  │  (State)     │  │  (Amber Mirage theme)  │  │
│  └────────────┘  └──────────────┘  └────────────────────────┘  │
│         │               │                    │                   │
│         ▼               ▼                    ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Firebase SDK (v12)                          │ │
│  │  ┌──────────┐  ┌───────────────┐  ┌────────────────────┐   │ │
│  │  │ Auth     │  │ Firestore     │  │ IndexedDB Cache   │   │ │
│  │  │ (Email/  │  │ (NoSQL Docs) │  │ (Offline Persist) │   │ │
│  │  │ Password)│  │               │  │                    │   │ │
│  │  └──────────┘  └───────────────┘  └────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
   ┌──────────────┐           ┌──────────────────┐
   │ Firebase Auth│           │  Cloud Firestore  │
   │ (User store) │           │  (Document DB)    │
   └──────────────┘           └──────────────────┘
```

### Major Modules
1. **Authentication Layer** — `firebase.js` + `authStore.js` + `RouteGuard.jsx`
2. **Theme System** — `themeStore.js` + CSS custom properties + SVG eyelid transitions
3. **Patient Module** — `PatientsPage.jsx`, `PatientDetailPage.jsx` (9 sub-tabs)
4. **Appointment Module** — `AppointmentsPage.jsx` (live queue with wait timers)
5. **Laboratory Module** — `LaboratoryPage.jsx` (panel templates + auto-billing)
6. **Pharmacy Module** — `PharmacyPage.jsx` + `PrescriptionsTab` (drug safety engine)
7. **Billing Module** — `BillingPage.jsx` (manual + auto-generated records)
8. **Navigation** — `BottomNav.jsx` (role-filtered) + `PageHeader.jsx` (with theme toggle)
9. **Shared Components** — `PatientAutocomplete`, `Icd10Autocomplete`, `DrugWarning`, `Skeleton`
10. **Static Data** — `drugInteractions.js` (28 interactions), `icd10.js` (32 common codes)

### Module Relationships
```
App.jsx (router root)
  ├── LoginPage          → auth
  ├── DashboardPage      → patients, appointments, labs, prescriptions
  ├── PatientsPage       → patients collection
  ├── PatientDetailPage  → patients/{id} + 7 subcollections
  │     ├── DemographicsTab    (patient doc)
  │     ├── VitalsTab          (patients/{id}/vitals)
  │     ├── LabsTab            (labResults where patientId)
  │     ├── HistoryTab         (patient doc: pmh, surgical, family, social)
  │     ├── ExamTab            (patients/{id}/examinations)
  │     ├── OrdersTab          (patients/{id}/orders)
  │     ├── PrescriptionsTab   (patients/{id}/prescriptions + allPrescriptions)
  │     ├── ImmunizationsTab   (patients/{id}/immunizations)
  │     └── DischargeTab       (patients/{id}/dischargePlans)
  ├── AppointmentsPage  → appointments collection
  ├── LaboratoryPage    → labResults + billing
  ├── PharmacyPage      → allPrescriptions
  ├── BillingPage       → billing
  └── UnauthorizedPage  → static
```

---

## 3. Complete Workflow Analysis

### 3.1 Patient Registration Flow (Reception / Nurse)
1. Staff navigates to **Patients** page
2. Clicks **+** (UserPlus icon) → `AddPatientModal` opens as a bottom sheet
3. Fills: First Name*, Last Name*, DOB, Gender, Blood Type, Phone, Address, Allergies, Emergency Contact
4. Submits → `addDoc(collection(db, 'patients'), ...)` 
   - Age auto-calculated from DOB
   - Allergies split from comma-separated string to array
   - Timestamp and `createdBy` uid recorded
   - `deleted: false` flag set for soft-delete
5. Toast success → modal closes → patient list re-renders from `onSnapshot`

### 3.2 Appointment Scheduling → Check-in → Completion Flow
1. **Schedule:** Staff opens Appointments page, clicks **+** → `AddApptModal`
   - Uses `PatientAutocomplete` to search existing patients
   - Selects date/time, duration, type, room, attending doctor (fetched from staff collection), amount
   - **Conflict detection:** Queries all appointments for the selected doctor on the same day, checks for time overlap
   - On submit → creates appointment doc with `scheduledAt` and `endTime` timestamps
2. **Check-in:** On the live queue tab, staff clicks **Check-in (Arrived)** → sets status to `arrived` and records `arrivedAt` timestamp
   - Wait timer starts counting from `arrivedAt`
3. **Complete:** Click **Mark Consult Completed** → status → `completed`
   - **Auto-creates billing record** (uses appointment's stored amount)
   - **Auto-creates exam note** (draft SOAP note from appointment reason) — for clinical roles only

### 3.3 Clinical Examination Flow (Doctor / Nurse)
1. Navigate to patient detail → **Exam** tab
2. Click **New Examination** → form opens with:
   - Subjective / Chief Complaint (required)
   - History of Present Illness
   - Objective / Physical Exam
   - Assessment / Diagnosis (ICD-10 autocomplete from local dataset)
   - Plan (required)
   - Intervention
   - Evaluation
3. Saves to `patients/{id}/examinations` subcollection
4. All examination history displayed in reverse chronological order

### 3.4 Prescription Flow (Doctor — with Safety Gates)
1. Navigate to patient detail → **Rx** tab
2. Click **New E-Prescription** → form for drug, dose, route, frequency, duration, instructions
3. On submit:
   - **Safety Check (Soft Stop):** Simulates adding the new drug to existing active medications
   - Runs `checkDrugInteractions()` against the 28-interaction database
   - Runs `checkDrugAllergies()` against patient's allergy list and 5 allergy class cross-references
   - If **HIGH or CONTRAINDICATED** risk found: blocks submission, shows detailed alerts, requires **Clinical Justification** in a prominent red-bordered text area
   - If no high risk: saves immediately
4. On save:
   - Writes to `patients/{id}/prescriptions/{rxId}` (patient-local)
   - **Mirrors** to `allPrescriptions/{rxId}` (global pharmacy view — denormalized for collection group simplicity)
   - Timestamp + duration used to compute expiration
5. **Discontinuation:** "Discontinue" button updates both local and global records to `status: 'discontinued'`

### 3.5 Laboratory Flow (Nurse / Doctor)
1. Navigate to **Laboratory** page → **+** → `AddLabModal`
2. Select patient via autocomplete, choose test from dropdown
   - If **panel test** (CBC, BMP, CMP, etc.): renders a table with all metrics and reference ranges — all must be filled
   - If **single test** (Troponin, CRP, etc.): simple result + unit + reference range fields
3. Amount auto-fills from `LAB_PRICES` map (configurable defaults)
4. On save:
   - Creates `labResults/{id}` document
   - **Auto-creates billing record** (`billing/{id}`) with the lab amount, linked via `source: 'lab'` and `sourceId`
5. Lab page shows all results with status tabs (Normal, Abnormal, Critical)

### 3.6 Billing Flow
1. **Manual:** Staff opens Billing page → **+** → `AddBillingModal` → patient, service type, amount, payment method
2. **Auto-generated:** From appointment completion and lab result entry
3. **Payment:** "Mark as Paid" button updates status and records `paidAt` timestamp
4. Summary cards show outstanding vs. collected totals

### 3.7 Authentication Flow
1. User visits any route → `RouteGuard` checks auth state
   - If `loading`: shows animated pulsating spinner with "Authenticating…"
   - If not authenticated: redirects to `/login`
   - If authenticated but wrong role: redirects to `/unauthorized`
2. **Login:** Email/password → `signInWithEmailAndPassword` with `browserSessionPersistence` (per-tab sessions)
   - On success: fetches staff profile from `staff/{uid}`, stores in Zustand
3. **Logout:** Confirmation dialog → `signOut(auth)` → clears Zustand store → redirects to `/login`
4. **Auth Persistence:** `App.jsx` useEffect listens to `onAuthStateChanged` — rehydrates user and profile on page reload

---

## 4. Technical Architecture

### 4.1 Frontend Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.5 | UI framework |
| React DOM | 19.2.5 | DOM rendering |
| React Router DOM | 7.14.2 | Client-side routing |
| Vite | 8.0.10 | Build tool / dev server |
| Tailwind CSS | 4.2.4 | Utility-first CSS with `@theme` tokens |
| Zustand | 5.0.12 | Lightweight state management |
| Firebase | 12.12.1 | Auth + Firestore + offline persistence |
| date-fns | 4.1.0 | Date formatting |
| Lucide React | 1.9.0 | Icon library |
| React Hot Toast | 2.6.0 | Toast notifications |
| Recharts | 3.8.1 | Charting (vitals trends, lab trends) |

### 4.2 Backend Technologies
- **Firebase Authentication** — Email/password provider
- **Cloud Firestore** — NoSQL document database
- **Firestore Security Rules** — Server-side access control
- **Vercel** — Static hosting with SPA rewrites

### 4.3 Database Structure
See Section 5 for full details.

### 4.4 APIs and Integrations
- **No external APIs.** All data flows through Firebase SDK directly from the client.
- Drug interaction data and ICD-10 codes are **static embedded datasets** (no API calls).
- Patient autocomplete queries Firestore directly (no search index).

### 4.5 Authentication and Authorization
- **Authentication:** Firebase Auth (email/password)
- **Authorization:** Three-layer model:
  1. **Firestore Security Rules** — server-enforced (e.g., only clinical roles can write to patients)
  2. **Route-level** — `RouteGuard` component checks `profile.role` against allowed roles array
  3. **UI-level** — Buttons, tabs, and actions conditionally rendered based on `profile?.role`

**Role Hierarchy:**
```
admin → doctor → nurse → staff
   (full access to everything)
   doctor: clinical + appointments + billing
   nurse: vitals, exams, labs, immunizations, medications
   staff: patients (read), appointments, billing
```

---

## 5. Database Analysis

### 5.1 Top-Level Collections

#### `staff`
| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth UID |
| email | string | Staff email |
| displayName | string | Display name |
| role | string | `admin`, `doctor`, `nurse`, `staff` |
| createdAt | Timestamp | Account creation date |
| active | boolean | Account status |
| firstName, lastName | string | (Optional, used by createAdmin script) |

#### `patients`
| Field | Type | Description |
|-------|------|-------------|
| firstName | string | Required |
| lastName | string | Required |
| dob | string | Date of birth (date string) |
| age | number | Auto-calculated from DOB |
| gender | string | Male/Female/Other |
| bloodType | string | A+ through O-, Unknown |
| phone | string | Contact number |
| address | string | Physical address |
| allergies | array[string] | Known allergies |
| emergencyContact | string | Emergency contact name |
| emergencyPhone | string | Emergency contact number |
| createdAt | Timestamp | Registration timestamp |
| createdBy | string | Staff UID who registered |
| deleted | boolean | Soft delete flag |
| pmh | array[object] | Past medical history |
| surgicalHistory | array[object] | Surgical history |
| familyHistory | array[object] | Family history |
| socialHistory | array[object] | Social history |

**Patient Subcollections:**
- `patients/{id}/vitals` — Vital sign measurements
- `patients/{id}/examinations` — Clinical exam notes
- `patients/{id}/orders` — Doctor's orders
- `patients/{id}/prescriptions` — Medication prescriptions
- `patients/{id}/immunizations` — Vaccination records
- `patients/{id}/dischargePlans` — Discharge instructions

#### `appointments`
| Field | Type | Description |
|-------|------|-------------|
| patientName | string | Denormalized for display |
| patientId | string | Reference to patients collection |
| scheduledAt | Timestamp | Appointment start time |
| endTime | Timestamp | Calculated end time |
| duration | number | Duration in minutes |
| type | string | Consultation/Follow-up/Procedure/etc. |
| reason | string | Chief complaint |
| doctor | string | Assigned doctor name |
| room | string | Room assignment |
| status | string | pending/confirmed/arrived/completed/cancelled |
| amount | number | Consultation fee (₱) |
| arrivedAt | Timestamp | Check-in time |
| createdBy | string | Staff UID |
| createdAt | Timestamp | Record creation |

#### `labResults`
| Field | Type | Description |
|-------|------|-------------|
| patientName | string | Denormalized |
| patientId | string | Reference |
| testName | string | Lab test name (CBC, BMP, etc.) |
| result | string | Single test result |
| unit | string | Measurement unit |
| referenceRange | string | Normal range |
| status | string | normal/abnormal/critical |
| panelData | map | Key-value panel results |
| notes | string | Clinical notes |
| orderedBy | string | Staff name |
| resultedAt | Timestamp | Result timestamp |

#### `allPrescriptions` (Global)
| Field | Type | Description |
|-------|------|-------------|
| drug | string | Medication name |
| dose | string | Dosage |
| route | string | Administration route |
| frequency | string | Dosing frequency |
| duration | string | Treatment days |
| instructions | string | Special instructions |
| status | string | active/completed/discontinued |
| patientId | string | Reference |
| patientName | string | Denormalized |
| prescribedBy | string | Prescriber name |
| prescribedByRole | string | Prescriber role |
| prescribedAt | Timestamp | Prescription date |
| overrideRationale | string | Clinical justification if safety overridden |

#### `billing`
| Field | Type | Description |
|-------|------|-------------|
| patientName | string | Denormalized |
| patientId | string | Reference |
| serviceType | string | Consultation/Laboratory/etc. |
| description | string | Service details |
| amount | number | Charge in ₱ |
| paymentMethod | string | Cash/PhilHealth/HMO/etc. |
| status | string | unpaid/paid/partial |
| source | string | manual/appointment/lab |
| sourceId | string | Reference to source document |
| createdBy | string | Staff UID |
| createdByName | string | Staff name |
| createdAt | Timestamp | Record creation |
| paidAt | Timestamp | Payment timestamp |

### 5.2 Relationships
```
patient (1) ──────────< (many) vitals
patient (1) ──────────< (many) examinations
patient (1) ──────────< (many) orders
patient (1) ──────────< (many) prescriptions
patient (1) ──────────< (many) immunizations
patient (1) ──────────< (many) dischargePlans
patient (1) ──────────< (many) labResults
patient (1) ──────────< (many) appointments
patient (1) ──────────< (many) billing
prescription (1) ─────< (1) allPrescriptions  (denormalized mirror)
```

### 5.3 Data Lifecycle
- **Soft Delete:** Patients are never truly deleted — `deleted: true` flag only
- **Prescriptions:** Auto-expire after `duration` days from `prescribedAt`
- **Appointments:** Status workflow: pending → confirmed → arrived → completed (or cancelled at any point)
- **Billing:** Auto-created from appointments and labs; manually marked paid

### 5.4 Potential Database Issues
1. **No composite indexes defined** — complex queries (e.g., appointments by doctor + date range) may fail until indexes are created
2. **Client-side filtering for deleted patients** — `.filter(p => p.deleted !== true)` fetches all patients then filters, wasteful at scale
3. **Denormalized patientName** — Name changes won't propagate to appointments, labResults, billing, or allPrescriptions
4. **No pagination** — All queries fetch the entire collection (`onSnapshot` without `limit`)
5. **AllPrescriptions mirroring** — Risk of inconsistency between `patients/{id}/prescriptions` and `allPrescriptions` if one write fails
6. **Lab results query by patientId** — Uses `where('patientId', '==', ...)` without composite orderBy index (sorting done client-side)

---

## 6. Module Breakdown

### 6.1 `src/firebase.js`
- **Purpose:** Initialize Firebase app, export Firestore and Auth instances
- **Dependencies:** Firebase SDK
- **Logic:** Reads config from `import.meta.env`, enables IndexedDB offline persistence with graceful error handling

### 6.2 `src/main.jsx`
- **Purpose:** React entry point
- **Renders:** `<App />` wrapped in `<StrictMode>`

### 6.3 `src/App.jsx` — Application Root
- **Purpose:** Router configuration, auth state listener, theme application, toast provider, theme transition SVGs
- **Inputs:** Firebase auth state, theme store
- **Outputs:** Rendered routes
- **Key Logic:**
  - `onAuthStateChanged` listener rehydrates user + staff profile
  - 10 routes with role-gated `RouteGuard` wrappers
  - SVG eyelid elements for dark mode transition animation
  - Toast styling with amber theme

### 6.4 `src/store/authStore.js` — Auth State
- **Purpose:** Global auth state via Zustand
- **State:** `user` (Firebase Auth user), `profile` (Firestore staff doc), `loading` (boolean)
- **Actions:** `setUser`, `setProfile`, `setLoading`, `logout`

### 6.5 `src/store/themeStore.js` — Theme State
- **Purpose:** Theme persistence + animated transition orchestration
- **State:** `theme` ('light'|'dark'), `transitionState` (7-state machine)
- **Logic:** Complex multi-phase animation:
  - Light→Dark: Lids sweep in (550ms), then snap away revealing dark content (850ms blur-in)
  - Dark→Light: Content blurs out (400ms), lids seal at center, then peel open (750ms)
- **Persistence:** `localStorage.getItem('clinix-theme')`; falls back to system preference

### 6.6 `src/components/RouteGuard.jsx`
- **Purpose:** Auth + role gate for protected routes
- **Inputs:** `children`, optional `roles` array
- **Logic:** Loading → spinner; No user → redirect /login; Wrong role → redirect /unauthorized; Else → render children

### 6.7 `src/components/BottomNav.jsx`
- **Purpose:** Fixed bottom navigation bar
- **Logic:** Filters `NAV_ALL` entries by user role; uses `NavLink` for active state styling
- **Special:** CSS auto-hides when any input/textarea/select is focused (virtual keyboard detection)

### 6.8 `src/components/PageHeader.jsx`
- **Purpose:** Sticky gradient header with back button, title, subtitle, actions slot, and theme toggle
- **Uses:** `startBlinkToggle()` from themeStore for animated dark mode toggle

### 6.9 `src/components/PatientAutocomplete.jsx`
- **Purpose:** Searchable patient dropdown (used in appointments, labs, billing)
- **Logic:** 300ms debounced query to `patients` collection; client-side `includes()` matching on full name; top 5 results; click-outside-to-close
- **Props:** `value`, `onChange`, `onSelect(id, name)`

### 6.10 `src/components/Icd10Autocomplete.jsx`
- **Purpose:** ICD-10 code search dropdown for exam assessments
- **Logic:** Searches local `COMMON_ICD10_CODES` (32 entries) by code or description; formats selection as `[CODE] Description`

### 6.11 `src/components/DrugWarning.jsx`
- **Purpose:** Renders drug interaction warnings with severity levels
- **Logic:** Maps severity to icon/color/badge; shows rationale and clinical management guidance; empty state shows green "No interactions detected" badge

### 6.12 `src/components/Skeleton.jsx`
- **Purpose:** Loading placeholders
- **Exports:** `SkeletonCard`, `SkeletonList`, `SkeletonStat`

### 6.13 `src/pages/LoginPage.jsx`
- **Purpose:** Staff authentication
- **Logic:** `browserSessionPersistence` for per-tab sessions; fetches staff profile on success; graceful error messages for invalid-credential, too-many-requests

### 6.14 `src/pages/DashboardPage.jsx`
- **Purpose:** Landing page with stats, quick actions, upcoming appointments, recent patients
- **Logic:**
  - Patient count via `getCountFromServer` (efficient server-side count)
  - Today's appointments via `onSnapshot`
  - Abnormal lab count — iterates latest results per patient+test
  - Active medication count — filters by duration expiration
  - All listeners unsubscribe on unmount

### 6.15 `src/pages/PatientsPage.jsx`
- **Purpose:** Patient registry with search and registration modal
- **Logic:** `onSnapshot` on patients ordered by `createdAt` desc; client-side search by name or phone; `AddPatientModal` with inline form

### 6.16 `src/pages/PatientDetailPage.jsx`
- **Purpose:** The most complex page — 9 tabs of patient clinical data
- **Sub-components:** `DemographicsTab`, `VitalsTab`, `OrdersTab`, `PrescriptionsTab`, `ExamTab`, `ImmunizationsTab`, `DischargeTab`, `HistoryTab`, `LabsTab`
- **Key Logic:**
  - Critical alerts banner (allergies + critical PMH conditions)
  - Tabs filtered by user role
  - Vitals: form logging + recharts trend line (HR + Weight)
  - Prescriptions: safety engine with soft-stop, clinical justification, dual-write mirroring
  - History: inline editable tables for PMH, surgical, family, social — single "Save All" button
  - Labs: Trend chart by metric selection, pulls from `labResults` collection
  - Orders: Type + priority + status workflow

### 6.17 `src/pages/AppointmentsPage.jsx`
- **Purpose:** Appointment scheduling + live queue management
- **Sub-components:** `AddApptModal`, `WaitTimer`
- **Key Logic:**
  - Doctor conflict detection: same-day time overlap check
  - Pre-fills amount based on appointment type
  - Status workflow: pending→confirmed→arrived→completed (auto-billing + auto-exam)
  - Live queue filter: today + arrived/confirmed status
  - Wait timer: counts minutes from `arrivedAt`, updates every 60s

### 6.18 `src/pages/LaboratoryPage.jsx`
- **Purpose:** Lab result entry and viewing
- **Key Logic:**
  - 19 lab templates with reference ranges
  - Panel tests render table inputs (all required)
  - Auto-billing on save with configurable prices
  - Status tabs with counts

### 6.19 `src/pages/PharmacyPage.jsx`
- **Purpose:** Global pharmacy view of all prescriptions
- **Key Logic:** Queries `allPrescriptions` collection; computes expiration; shows drug interaction alerts across all active medications

### 6.20 `src/pages/BillingPage.jsx`
- **Purpose:** Financial records management
- **Key Logic:** Summary stats (outstanding/collected); status tabs; mark-as-paid

### 6.21 `src/pages/UnauthorizedPage.jsx`
- **Purpose:** Access denied page with return button

### 6.22 `src/data/drugInteractions.js`
- **Purpose:** Drug safety knowledge base
- **Contents:** 28 drug-drug interactions (5 contraindicated, 17 high, 4 moderate) + 5 allergy cross-reference classes
- **Functions:** `checkDrugInteractions(drugNames)`, `checkDrugAllergies(drugName, patientAllergies)`

### 6.23 `src/data/icd10.js`
- **Purpose:** Curated ICD-10 codes for diagnosis autocomplete
- **Contents:** 32 common primary care codes across 10 categories

### 6.24 `scripts/createAdmin.mjs`
- **Purpose:** One-time staff account bootstrapping
- **Logic:** Creates 4 Firebase Auth users (admin, doctor, nurse, staff) with Firestore staff documents; handles email-already-in-use gracefully

### 6.25 `firestore.rules`
- **Purpose:** Server-side access control
- **Logic:** `getRole()` helper function reads staff doc; role-based write restrictions; all authenticated users can read patients and appointments; clinical roles only for write operations

---

## 7. Business Logic Analysis

### 7.1 Drug Interaction Checker
**Algorithm:** `checkDrugInteractions(drugNames)`
1. Normalizes all input drug names to lowercase
2. Iterates through 28 interaction pairs
3. For each pair, checks if **both** drugs are present in the patient's medication list
4. Matching uses **substring inclusion** (`a.includes(drug)` or `drug.includes(a)`) — handles partial names
5. Returns array of triggered interactions with severity, rationale, and management guidance

**Performance:** O(n × m) where n = patient drugs, m = 28 interaction pairs. Negligible at current scale.

### 7.2 Allergy Cross-Reference
**Algorithm:** `checkDrugAllergies(drugName, patientAllergies)`
1. Direct match: drug name contains allergy name or vice versa
2. Class match: checks 5 allergy classes (penicillin, sulfa, NSAIDs, opioids, cephalosporins)
3. Returns warning string or null

### 7.3 Appointment Conflict Detection
**Algorithm:** In `AddApptModal.handleSubmit()`
1. If a doctor is assigned, queries all appointments for that doctor
2. Filters to same-day appointments (year + month + date match)
3. Excludes cancelled appointments
4. Checks time overlap: `start < aEnd && end > aStart`
5. If conflict found, blocks with toast error

**Limitation:** Queries ALL appointments for the doctor (no date filter on the query) then filters client-side. Will degrade with history.

### 7.4 Prescription Expiration
**Algorithm:** In `PrescriptionsTab` and `PharmacyPage`
1. For each active prescription, computes: `prescribedAt + (duration × 86,400,000ms)`
2. If `Date.now() > expiration`, status becomes "completed" (expired)
3. Used for both display and interaction checking (only active prescriptions checked)

### 7.5 Vital Signs Trends
**Algorithm:** In `VitalsTab`
1. Maps vitals subcollection to chart data: `{ time, hr, weight }`
2. Reverses array (oldest first for timeline)
3. Renders dual-axis LineChart: HR on left Y-axis, Weight on right Y-axis

### 7.6 Lab Result Trends
**Algorithm:** In `LabsTab` (PatientDetailPage)
1. Queries `labResults` where `patientId == currentPatient`
2. Extracts all unique metric names across single results and panel data
3. For selected metric, builds time-series from all results containing that metric
4. Requires ≥2 data points to render trend line

### 7.7 Role-Based UI Rendering
**Pattern:** Everywhere in the codebase
```javascript
{['admin', 'doctor', 'nurse'].includes(profile?.role) && (
  <button>...</button>
)}
```
Applied to: route guards, tab visibility, form access, action buttons, quick actions, dashboard stat visibility

### 7.8 Hidden Assumptions
1. **Patient names are unique** — autocomplete and denormalization assume no collisions
2. **Staff emails are valid Firebase Auth emails** — no email verification flow
3. **Single clinic** — no multi-tenancy, no facility/organization concept
4. **Browser timezone** — `Timestamp.now()` uses client clock which may be incorrect
5. **AllPrescriptions mirror always in sync** — no transaction/atomic write guarantee
6. **Lab templates are authoritative** — no support for custom panels or per-clinic configurations
7. **Drug names are exact-ish** — substring matching may produce false positives/negatives

---

## 8. Current System State

### 8.1 Implemented Features
- [x] Email/password authentication with role-based profiles
- [x] Patient CRUD with soft-delete
- [x] Patient demographics display
- [x] Vitals logging with trend charts
- [x] Clinical examinations with ICD-10 autocomplete
- [x] Doctor's orders (medication, lab, imaging, procedure, referral, diet)
- [x] E-Prescriptions with drug interaction safety engine
- [x] Allergy checking with class cross-reference
- [x] Clinical justification override workflow
- [x] Immunization records
- [x] Discharge planning
- [x] Appointment scheduling with conflict detection
- [x] Live queue with wait timers
- [x] Auto-billing on appointment completion and lab entry
- [x] Manual billing records
- [x] Lab results with panel templates and reference ranges
- [x] Lab result trend charts
- [x] Patient medical history (PMH, surgical, family, social)
- [x] Dashboard with live stats
- [x] Dark/light theme with animated transition
- [x] Role-based route guards
- [x] Firestore security rules
- [x] Offline persistence
- [x] Admin account setup script
- [x] Vercel deployment configuration

### 8.2 Partially Implemented Features
- **Patient search:** Basic client-side include matching; no full-text search, no pagination
- **Appointment reminders:** No notification system
- **Print/export:** No PDF or print functionality for prescriptions, lab results, or discharge summaries
- **Audit logging:** `createdBy` fields exist but no comprehensive audit trail

### 8.3 Missing Features
- **Patient portal:** No patient-facing access
- **Multi-tenancy:** Only one clinic
- **Inventory management:** No pharmacy stock tracking
- **Referral management:** Order type exists but no workflow
- **Messaging:** No internal staff communication
- **Document upload:** No file/attachment support
- **Reporting:** No aggregate analytics beyond dashboard
- **Email/SMS notifications:** None
- **Data export:** No CSV/PDF export
- **Backup/restore:** No automated backup

### 8.4 Technical Debt
1. **No TypeScript** — all plain JavaScript with JSDoc comments sporadically
2. **No tests** — zero unit, integration, or E2E tests
3. **No error boundaries** — React crashes are unhandled
4. **Inline styles** — heavy use of inline style objects mixed with CSS classes
5. **Large components** — `PatientDetailPage.jsx` is 1260 lines with 9 sub-components in the same file
6. **No custom hooks** — logic repeated across pages (e.g., Firestore subscription patterns)
7. **Client-side data filtering** — `deleted: true` filter, lab trend aggregation, appointment conflict detection all happen client-side
8. **Hardcoded configuration** — staff accounts in script, lab prices in component, appointment prices in component
9. **No environment validation** — app silently fails if Firebase env vars are missing
10. **Collection group index** — Pharmacy comments mention needing a `collectionGroup` index but uses denormalized mirror instead

---

## 9. Strengths

### 9.1 Good Architectural Decisions
1. **Zustand over Redux/Context** — Minimal boilerplate, excellent performance, simple API for this app's complexity level
2. **Firestore onSnapshot for real-time** — Dashboard and queue updates instantly without polling
3. **Role-based access at 3 layers** — Defense in depth: Firestore rules + route guards + UI conditionals
4. **Soft-delete pattern** — Safer than hard deletes for medical data
5. **Denormalized `allPrescriptions`** — Simplifies cross-patient pharmacy queries significantly
6. **Lab template system** — Extensible, self-documenting reference ranges per test
7. **Drug interaction data as static module** — No API dependency, instant checking, version-controlled

### 9.2 Scalability Considerations
1. **Offline persistence** — Works with intermittent connectivity
2. **Vercel edge deployment** — CDN-distributed static assets
3. **Firestore scales horizontally** — No server management needed
4. **Browser session persistence** — Supports multiple simultaneous tabs with independent sessions

### 9.3 Security Considerations
1. **Firestore security rules enforce role-based access server-side**
2. **Environment variables** for Firebase config (not hardcoded in source)
3. **`noindex, nofollow` meta tag** — prevents search engine indexing
4. **`user-scalable=no` on mobile** — prevents accidental zoom on clinical forms
5. **Confirmation dialogs** — for destructive actions (logout, discontinue medication)
6. **Clinical justification required** — for high-risk prescription overrides

---

## 10. Weaknesses and Risks

### 10.1 Performance Bottlenecks
1. **Full collection scans** — `PatientsPage`, `AppointmentsPage`, `LaboratoryPage`, `BillingPage`, `PharmacyPage` all subscribe to entire collections with no pagination. At 1000+ records, these will become slow.
2. **Client-side filtering** — `deleted: true` filter, appointment conflict detection, lab metric extraction, and patient search all process entire datasets in memory
3. **Large component bundles** — `PatientDetailPage.jsx` is a single 1260-line file with 9 sub-components; impacts initial load and code splitting potential
4. **No React.lazy/Suspense** — No code splitting, all pages bundled together

### 10.2 Security Concerns
1. **Hardcoded credentials in `scripts/createAdmin.mjs`** — Firebase API keys and staff passwords committed to source control
2. **Weak demo passwords** — `admin1`, `doctor1`, etc. with no password policy enforcement
3. **No email verification** — Accounts created without verifying email ownership
4. **`browserSessionPersistence`** — Sessions lost on tab close, but no session timeout for idle users
5. **Client-side drug interaction checking** — Could be bypassed by modifying client code (but Firestore rules are the real gate)
6. **No input sanitization** — Form inputs written directly to Firestore without XSS protection (though React's JSX escaping mitigates most)

### 10.3 Maintainability Issues
1. **No TypeScript** — No type safety, difficult refactoring, poor IDE support
2. **Inline styles everywhere** — Mix of Tailwind classes, CSS custom properties, and raw style objects makes theming changes error-prone
3. **Massive single-file components** — `PatientDetailPage.jsx` (1260 lines), `index.css` (882 lines)
4. **No shared form validation** — Each form implements validation independently
5. **Magic strings** — Role names (`'admin'`, `'doctor'`, `'nurse'`, `'staff'`) repeated ~150+ times across the codebase
6. **Duplicate Firestore subscription patterns** — Every page has same `onSnapshot` boilerplate

### 10.4 Code Quality Concerns
1. **No linting enforcement** — `eslint` is configured but `eslint.config.js` not reviewed
2. **No formatting standard** — No Prettier config
3. **Console error swallowing** — `console.warn('Failed to fetch doctors:', e)` without user-facing feedback
4. **Unused imports** — `where` imported but sometimes unused, `USER` imported in unused files
5. **Mixed promise handling** — Some use `.catch()`, some use `try/catch`, some use both inconsistently

---

## 11. Improvement Recommendations

### Critical
| # | Issue | Recommendation |
|---|-------|---------------|
| C1 | **Hardcoded credentials** | Move API keys and passwords from `createAdmin.mjs` to `.env`; add to `.gitignore`; rotate exposed keys immediately |
| C2 | **No pagination** | Add `limit()` and cursor-based pagination to all collection queries; implement infinite scroll or "Load More" |
| C3 | **No TypeScript** | Migrate incrementally — start with store files, then data modules, then components |
| C4 | **No tests** | Add at minimum: drug interaction checker tests, allergy cross-reference tests, appointment conflict logic tests |

### High Priority
| # | Issue | Recommendation |
|---|-------|---------------|
| H1 | **Denormalized names** | Create a Cloud Function or client-side batch update to propagate patient name changes |
| H2 | **Monolithic PatientDetailPage** | Extract each tab into its own file under `src/pages/patient/` |
| H3 | **Shared hooks** | Extract `useFirestoreCollection`, `useFirestoreDoc`, `useAuthGuard` hooks |
| H4 | **Role constants** | Create `src/constants/roles.js` with `ROLES` enum and `canAccess(role, ...roles)` helper |
| H5 | **Error boundaries** | Add React error boundary at route level to prevent full-page crashes |
| H6 | **Input validation** | Add Zod or Yup schemas for all form submissions |

### Medium Priority
| # | Issue | Recommendation |
|---|-------|---------------|
| M1 | **Code splitting** | `React.lazy` + `Suspense` for all page routes |
| M2 | **Firestore composite indexes** | Create `firestore.indexes.json` and deploy with `firebase deploy --only firestore:indexes` |
| M3 | **Centralized price config** | Move `LAB_PRICES` and appointment prices to a shared config or Firestore document |
| M4 | **Audit logging** | Add `auditLogs` collection with user, action, timestamp, target for all write operations |
| M5 | **PDF export** | Add print-friendly CSS and/or jsPDF for prescriptions, lab results, discharge summaries |
| M6 | **Environment validation** | Add startup check that all `VITE_FIREBASE_*` env vars are set |

### Nice-to-Have
| # | Issue | Recommendation |
|---|-------|---------------|
| N1 | **Internationalization** | Extract all user-facing strings for i18n |
| N2 | **Offline queue** | Queue writes when offline, sync when reconnected |
| N3 | **Dark mode persistence bug** | Theme eyelid animation sometimes gets stuck — add timeout fallback |
| N4 | **Keyboard shortcuts** | Add `/` for search, `n` for new patient, etc. |
| N5 | **PWA** | Add service worker + manifest for installable app |
| N6 | **Analytics** | Add anonymous usage tracking for feature prioritization |

---

## 12. AI Handoff Documentation

### Project Purpose
ClinixEHR is a React 19 + Firebase Electronic Health Record system for small clinics. It manages patients, appointments, lab results, prescriptions, immunizations, and billing with role-based access control.

### Architecture
- **Frontend:** Vite + React 19 + Tailwind CSS 4 + Zustand + React Router 7
- **Backend:** Firebase Auth (email/password) + Cloud Firestore (NoSQL)
- **Deployment:** Vercel (SPA with rewrites)
- **Key Patterns:** onSnapshot real-time listeners, role-gated components, denormalized data mirroring

### Current Progress
- **~3,500 lines of code** across 17 source files
- **9 pages:** Login, Dashboard, Patients, PatientDetail (9 tabs), Appointments, Laboratory, Pharmacy, Billing, Unauthorized
- **6 shared components:** RouteGuard, BottomNav, PageHeader, PatientAutocomplete, Icd10Autocomplete, DrugWarning, Skeleton
- **2 data modules:** drugInteractions.js (28 interactions + allergy cross-ref), icd10.js (32 codes)
- **1 admin script:** createAdmin.mjs (creates 4 staff accounts)
- **Firestore rules:** Role-based read/write restrictions

### Known Limitations
- No pagination (full collection scans)
- No TypeScript
- No tests
- Hardcoded credentials in createAdmin.mjs
- Denormalized patient names don't propagate
- No error boundaries
- No code splitting

### Recommended Next Steps
1. **Immediately:** Remove hardcoded credentials from `createAdmin.mjs`, rotate keys
2. **Short-term:** Add pagination to all collection queries
3. **Short-term:** Extract `PatientDetailPage` tabs into separate files
4. **Medium-term:** Add TypeScript incrementally
5. **Medium-term:** Add test suite for business logic

---

## 13. Architecture Diagrams (Text Format)

### 13.1 Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Browser  │  │  Toaster  │  │  Theme   │  │   Routes   │ │
│  │ Router   │  │  (Toast)  │  │  Lids    │  │   (10)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
│                                                     │       │
│  ┌──────────────────────────────────────────────────┘       │
│  │                                                          │
│  ├── LoginPage                                              │
│  ├── DashboardPage ─── PageHeader + BottomNav + Skeletons   │
│  ├── PatientsPage ─── AddPatientModal + BottomNav           │
│  ├── PatientDetailPage ─── 9 Tabs + BottomNav               │
│  │     ├── DemographicsTab                                  │
│  │     ├── VitalsTab ─── recharts LineChart                 │
│  │     ├── LabsTab ─── recharts LineChart                   │
│  │     ├── HistoryTab (PMH + Surgical + Family + Social)    │
│  │     ├── ExamTab ─── Icd10Autocomplete                    │
│  │     ├── OrdersTab                                        │
│  │     ├── PrescriptionsTab ─── DrugWarning + Safety Engine │
│  │     ├── ImmunizationsTab                                 │
│  │     └── DischargeTab                                     │
│  ├── AppointmentsPage ─── AddApptModal + WaitTimer          │
│  ├── LaboratoryPage ─── AddLabModal                         │
│  ├── PharmacyPage ─── DrugWarning                           │
│  ├── BillingPage ─── AddBillingModal                        │
│  └── UnauthorizedPage                                       │
│                                                              │
│  Shared Components:                                          │
│    RouteGuard, PageHeader, BottomNav, PatientAutocomplete,   │
│    Icd10Autocomplete, DrugWarning, Skeleton                  │
│                                                              │
│  Data:                                                       │
│    drugInteractions.js, icd10.js                             │
│                                                              │
│  Stores:                                                     │
│    authStore (Zustand), themeStore (Zustand)                 │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Data Flow Diagram
```
┌──────────┐    ┌──────────────┐    ┌─────────────────┐
│  Login   │───▶│  Firebase    │───▶│  authStore      │
│  Page    │    │  Auth        │    │  (user, profile) │
└──────────┘    └──────────────┘    └────────┬────────┘
                                             │
                    ┌────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  RouteGuard checks: user? role? → allow or redirect         │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
   Dashboard   Patients   Appointments  Laboratory  Billing
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Firestore                          │
│  ┌────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────┐   │
│  │ staff  │ │ patients │ │ appointments│ │ labResults │   │
│  └────────┘ └──────────┘ └─────────────┘ └────────────┘   │
│  ┌────────────────┐ ┌─────────┐ ┌───────────────┐          │
│  │allPrescriptions│ │ billing │ │subcollections:│          │
│  └────────────────┘ └─────────┘ │ vitals, exams,│          │
│                                  │ orders, rx,   │          │
│                                  │ immunizations,│          │
│                                  │ dischargePlans│          │
│                                  └───────────────┘          │
└─────────────────────────────────────────────────────────────┘
        │                                               │
        ▼                                               ▼
┌──────────────┐                              ┌──────────────┐
│ onSnapshot() │                              │ addDoc()     │
│ (real-time)  │                              │ updateDoc()  │
└──────────────┘                              └──────────────┘
        │                                               │
        ▼                                               ▼
┌──────────────┐                              ┌──────────────┐
│ React State  │                              │ Toast        │
│ re-renders   │                              │ notification │
└──────────────┘                              └──────────────┘
```

### 13.3 Sequence Diagram — Prescription Soft Stop
```
Doctor                    React                     drugInteractions.js
  │                         │                              │
  │  Fill Rx form           │                              │
  │  Click "Issue"          │                              │
  │ ──────────────────────▶ │                              │
  │                         │  checkDrugInteractions()     │
  │                         │ ───────────────────────────▶ │
  │                         │                              │
  │                         │  checkDrugAllergies()        │
  │                         │ ───────────────────────────▶ │
  │                         │                              │
  │                         │  ◀─── interactions[] ─────── │
  │                         │  ◀─── allergyWarning ────── │
  │                         │                              │
  │                         │  hasHighRisk? YES            │
  │                         │  setPendingSafety(...)       │
  │  ◀── Toast "Safety     │                              │
  │      risks detected"    │                              │
  │                         │                              │
  │  Review alerts          │                              │
  │  Fill justification     │                              │
  │  Click "Override &      │                              │
  │  Issue"                 │                              │
  │ ──────────────────────▶ │                              │
  │                         │  pendingSafety exists? YES   │
  │                         │  justification exists? YES   │
  │                         │                              │
  │                         │  setDoc(patients/.../rx)     │
  │                         │ ──────────▶ Firestore        │
  │                         │                              │
  │                         │  setDoc(allPrescriptions/..) │
  │                         │ ──────────▶ Firestore        │
  │                         │                              │
  │  ◀── Toast "Prescribed!"│                              │
```

### 13.4 Deployment Diagram
```
┌──────────────────────────────────────────────────────────────┐
│                     Developer Machine                        │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────────┐  │
│  │ VS Code  │  │  Vite     │  │  scripts/createAdmin.mjs │  │
│  │          │  │  Dev Srv  │  │  (Node.js, run manually) │  │
│  └──────────┘  └───────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
        │                    │
        │ git push           │ npm run build && vercel deploy
        ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│   GitHub     │    │     Vercel       │
│   (source)   │───▶│   (hosting)      │
│              │    │  clinixehr.      │
│              │    │  vercel.app      │
└──────────────┘    └──────────────────┘
                            │
                            │ Firebase SDK (browser)
                            ▼
              ┌─────────────────────────┐
              │    Google Cloud         │
              │  ┌───────────────────┐  │
              │  │ Firebase Auth     │  │
              │  │ (user accounts)   │  │
              │  └───────────────────┘  │
              │  ┌───────────────────┐  │
              │  │ Cloud Firestore   │  │
              │  │ (all app data)    │  │
              │  │ + Security Rules  │  │
              │  └───────────────────┘  │
              └─────────────────────────┘
```

---

## 14. Development Roadmap

### Immediate (Week 1-2)
- [ ] **Remove hardcoded credentials** from `createAdmin.mjs` — use environment variables
- [ ] **Rotate exposed Firebase API keys** if this is a public repository
- [ ] **Add pagination** to PatientsPage, AppointmentsPage, LaboratoryPage, PharmacyPage, BillingPage
- [ ] **Create `src/constants/roles.js`** and replace all magic role strings
- [ ] **Add error boundary** component at App level
- [ ] **Fix `firestore.rules`** — appointments currently allow any authenticated user to write (should restrict status transitions or add validation)

### Short-term (Month 1-2)
- [ ] **Extract PatientDetailPage tabs** into `src/pages/patient/` directory
- [ ] **Create shared hooks:** `useFirestoreCollection`, `useFirestoreDoc`, `useRealtimeDoc`
- [ ] **Add TypeScript** to stores, data modules, and utility functions first
- [ ] **Write tests** for drugInteractions.js, icd10.js, authStore.js
- [ ] **Add input validation** with Zod schemas
- [ ] **Set up Firestore composite indexes** and `firestore.indexes.json`
- [ ] **Add code splitting** with `React.lazy` + `Suspense`

### Long-term (Month 3-6)
- [ ] **Cloud Functions:** Patient name propagation, prescription expiration cleanup, audit logging
- [ ] **PDF/Print:** Prescription print layout, lab result PDF export, discharge summary
- [ ] **Patient portal:** Read-only access for patients to their own records
- [ ] **Notification system:** Email/SMS reminders for appointments
- [ ] **Reporting dashboard:** Revenue reports, patient demographics, prescription analytics
- [ ] **Document upload:** File attachments for lab results, referrals, consent forms
- [ ] **PWA support:** Service worker, offline queue, install prompt
- [ ] **Internationalization:** i18n framework for multi-language support