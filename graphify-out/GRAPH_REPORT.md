# Graph Report - .  (2026-06-05)

## Corpus Check
- Corpus is ~20,182 words - fits in a single context window. You may not need a graph.

## Summary
- 97 nodes · 215 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Patient Details UI & Auth State|Patient Details UI & Auth State]]
- [[_COMMUNITY_Firebase Auth & Labs UI|Firebase Auth & Labs UI]]
- [[_COMMUNITY_Dashboard & Billing UI|Dashboard & Billing UI]]
- [[_COMMUNITY_Pharmacy & Drug Interactions|Pharmacy & Drug Interactions]]
- [[_COMMUNITY_App Entry & Theme Layout|App Entry & Theme Layout]]
- [[_COMMUNITY_Admin Account Setup Script|Admin Account Setup Script]]
- [[_COMMUNITY_Appointments & Wait Timer|Appointments & Wait Timer]]
- [[_COMMUNITY_Patients Registry Management|Patients Registry Management]]
- [[_COMMUNITY_ICD-10 Diagnostic Auto-complete|ICD-10 Diagnostic Auto-complete]]

## God Nodes (most connected - your core abstractions)
1. `useAuthStore` - 31 edges
2. `db` - 11 edges
3. `SkeletonList()` - 8 edges
4. `useThemeStore` - 5 edges
5. `auth` - 4 edges
6. `App()` - 3 edges
7. `PageHeader()` - 3 edges
8. `checkDrugInteractions()` - 3 edges
9. `AddApptModal()` - 3 edges
10. `AppointmentsPage()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AddApptModal()` --calls--> `useAuthStore`  [EXTRACTED]
  pages/AppointmentsPage.jsx → src/store/authStore.js
- `AppointmentsPage()` --calls--> `useAuthStore`  [EXTRACTED]
  pages/AppointmentsPage.jsx → src/store/authStore.js
- `LoginPage()` --calls--> `useAuthStore`  [EXTRACTED]
  pages/LoginPage.jsx → src/store/authStore.js
- `BottomNav()` --calls--> `useAuthStore`  [EXTRACTED]
  src/components/BottomNav.jsx → src/store/authStore.js
- `PageHeader()` --calls--> `useThemeStore`  [EXTRACTED]
  components/PageHeader.jsx → src/store/themeStore.js

## Communities (11 total, 1 thin omitted)

### Community 0 - "Patient Details UI & Auth State"
Cohesion: 0.17
Nodes (10): PatientAutocomplete(), AddLabModal(), LAB_TEMPLATES, LAB_TESTS, LaboratoryPage(), LoginPage(), app, auth (+2 more)

### Community 1 - "Firebase Auth & Labs UI"
Cohesion: 0.33
Nodes (12): DemographicsTab(), DischargeTab(), ExamTab(), HistoryTab(), ImmunizationsTab(), LabsTab(), OrdersTab(), PatientDetailPage() (+4 more)

### Community 2 - "Dashboard & Billing UI"
Cohesion: 0.21
Nodes (6): SkeletonList(), SkeletonStat(), AddBillingModal(), PAYMENT_METHODS, SERVICE_TYPES, DashboardPage()

### Community 3 - "Pharmacy & Drug Interactions"
Cohesion: 0.2
Nodes (6): BottomNav(), NAV_ALL, RouteGuard(), AddPatientModal(), BLOOD_TYPES, GENDER_OPTIONS

### Community 4 - "App Entry & Theme Layout"
Cohesion: 0.22
Nodes (6): SEVERITY_MAP, ALLERGY_CROSS_REFERENCE, checkDrugAllergies(), checkDrugInteractions(), DRUG_INTERACTIONS, PharmacyPage()

### Community 5 - "Admin Account Setup Script"
Cohesion: 0.33
Nodes (7): AddApptModal(), AppointmentsPage(), APPT_TYPES, DURATIONS, ROOMS, STATUS_OPTIONS, WaitTimer()

### Community 6 - "Appointments & Wait Timer"
Cohesion: 0.36
Nodes (3): PageHeader(), App(), useThemeStore

### Community 7 - "Patients Registry Management"
Cohesion: 0.29
Nodes (7): app, auth, createStaffAccount(), db, firebaseConfig, main(), STAFF_ACCOUNTS

## Knowledge Gaps
- **17 isolated node(s):** `firebaseConfig`, `STAFF_ACCOUNTS`, `app`, `auth`, `db` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `Firebase Auth & Labs UI` to `Patient Details UI & Auth State`, `Dashboard & Billing UI`, `Pharmacy & Drug Interactions`, `App Entry & Theme Layout`, `Admin Account Setup Script`, `Appointments & Wait Timer`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `db` connect `Patient Details UI & Auth State` to `Firebase Auth & Labs UI`, `Dashboard & Billing UI`, `Pharmacy & Drug Interactions`, `App Entry & Theme Layout`, `Admin Account Setup Script`, `Appointments & Wait Timer`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `LoginPage()` connect `Patient Details UI & Auth State` to `Firebase Auth & Labs UI`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `firebaseConfig`, `STAFF_ACCOUNTS`, `app` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._