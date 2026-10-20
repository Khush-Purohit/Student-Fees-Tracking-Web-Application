# Web Student Fees Tracker (PWA) — System Design & Implementation Specification

> **Context for AI Agents & Developers:**  
> This document specifies the complete system architecture, security model, and implementation blueprint for building a **Static Web Application & Progressive Web App (PWA)** for the Student Fees Tracker. It is designed to be hosted for free on **GitHub Pages**, backed by a private GitHub repository for zero-cost cloud data synchronization, and secured using **Client-Side Master PIN / AES-GCM encrypted Personal Access Token (PAT) authentication**.

---

## 1. Project Overview & Scope

### 1.1 Purpose
A solo educator / private tutor needs an intuitive, instantaneous, and zero-cost web application to manage student profiles, monitor monthly fee cycles, and persist records securely without running or paying for cloud servers, managed databases, or backend APIs.

### 1.2 Target User & Environment
* **User:** Single tutor / solo educator.
* **Platforms:** Any modern web browser (Android Chrome, iOS Safari, Windows/Mac desktop browsers).
* **Installation:** Installable as a Progressive Web App (PWA) with "Add to Home Screen" on mobile and desktop.
* **Hosting:** 100% static hosting on **GitHub Pages** (free).
* **Database & Cloud Storage:** Single `students_data.json` file inside a **Private GitHub Repository** accessed via GitHub's REST API (v3).

### 1.3 Key Features in Scope
* **Client-Side Master PIN Authentication:**
  * Master PIN / Password protects the application from unauthorized local access.
  * Encrypts and decrypts the GitHub Personal Access Token (PAT) locally using AES-GCM.
  * Auto-locks after inactivity or manual lock.
* **Student Directory:**
  * Add, view, edit, and archive student records.
  * Fields: Full name, grade/standard, father's name & phone, mother's name & phone, residential address, joining date, monthly fee, and teacher notes.
  * 1-click native actions: Call (`tel:`) and WhatsApp (`https://wa.me/`).
* **Monthly Fee Tracking:**
  * Track fee status per calendar month (`PAID`, `DUE`, `PARTIAL`).
  * Log payment amount, payment date, and transaction notes (e.g., "Paid via UPI / Cash").
  * Fee history timeline per student.
* **Dashboard & Metrics:**
  * Active student count.
  * Fees collected vs. pending for any selected month.
  * Instant search by student name/phone and filter chips (`All`, `Pending`, `Paid`).
* **GitHub-Backed Cloud Sync & Offline Support:**
  * Direct synchronization of `students_data.json` inside a **Private GitHub Repository**.
  * Offline-first local caching in `localStorage` / `IndexedDB` with Service Worker for instant loading even without internet.
  * Manual and automatic background push/pull sync with Git SHA conflict detection.

### 1.4 Explicit Non-Goals
* No external server infrastructure (Node.js/Python backend, Firebase, Supabase, or AWS).
* No multi-tenant user authentication or multi-tutor collaboration.
* No parent/student login portal.
* No third-party payment gateway SDK integrations.

---

## 2. Decision Log

| ID | Decision Area | Chosen Approach | Alternatives Considered | Rationale |
|---|---|---|---|---|
| **D-01** | **Application Type** | Client-Side SPA + Progressive Web App (PWA) | Flutter Android App, Next.js with server | Universal cross-device access (Phone, Tablet, PC) with zero build/deployment friction and instant web updates. |
| **D-02** | **Frontend Stack** | React + TypeScript + Vite + Tailwind CSS | Vanilla JS, Vue 3, Flutter Web | Fast build tooling, type-safety, tiny bundle footprint (<250KB gzipped vs 15MB+ for Flutter Web), clean modern UI. |
| **D-03** | **Hosting Target** | GitHub Pages (via GitHub Actions) | Cloudflare Pages, Netlify, Vercel | Direct integration with GitHub ecosystem, zero cost, completely automated CI/CD deployment on `git push`. |
| **D-04** | **Data Persistence** | `students_data.json` in Private GitHub Repo via GitHub REST API v3 | Firebase, Supabase, Google Sheets API | Zero hosting costs, automated Git commit versioning, full data ownership, simple JSON format. |
| **D-05** | **Authentication & Security** | Master PIN + Web Crypto API (PBKDF2 + AES-GCM) + GitHub Fine-Grained PAT | Plain PAT in localStorage, Cloudflare Zero Trust, GitHub OAuth | Zero external auth dependencies, full security for student PII: unauthorized users only see a locked screen; PAT is never stored in plain text. |
| **D-06** | **Offline Capability** | Service Worker (Workbox/Vite PWA) + LocalStorage/IndexedDB cache | Online-only | Allows the tutor to check records or mark fees even without an active cellular connection. |

---

## 3. Security & Authentication Architecture (Approach 1)

GitHub Pages serves static assets publicly. To ensure complete privacy and zero data leakage, student data is **never** stored in the public website repository. Instead:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PUBLIC GITHUB PAGES (Static UI)                      │
│                  https://<username>.github.io/<repo>                    │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                         LOCK SCREEN                            │   │
│   │                 Enter 4-6 Digit Master PIN                     │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ PBKDF2 Key Derivation               │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │     AES-GCM-256 Decryption of Encrypted GitHub PAT in Storage   │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Memory-only Bearer PAT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      GITHUB REST API v3 (CORS)                         │
│       GET / PUT https://api.github.com/repos/{owner}/{private-repo}    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Bearer PAT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PRIVATE GITHUB REPOSITORY                          │
│               Contains ONLY: /students_data.json                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Initial Setup Flow (First Launch)
1. User visits the web app for the first time.
2. The app detects no stored credentials and displays the **First-Time Setup Wizard**:
   * **GitHub Owner / Username** (e.g., `tutor-john`)
   * **Private Repository Name** (e.g., `tutor-fees-data`)
   * **Branch** (default `main`)
   * **GitHub Fine-Grained Personal Access Token (PAT)**
   * **Create a Master PIN / Password** (e.g., 4 to 8 digits)
3. **Encryption Pipeline:**
   * A cryptographic random 16-byte salt is generated via `window.crypto.getRandomValues()`.
   * A 256-bit encryption key is derived from the Master PIN using `PBKDF2` with `SHA-256` (100,000 iterations).
   * A fresh 12-byte Initialization Vector (IV) is generated.
   * The GitHub PAT is encrypted using `AES-GCM-256`.
   * The ciphertext, salt, and IV (all Base64-encoded) along with repo metadata are saved to browser `localStorage`.
   * **The plain PAT and PIN are never written to disk or storage.**

### 3.2 Unlock Flow (Subsequent Visits)
1. The user opens the app and is greeted by the **PIN Unlock Screen**.
2. Entering the PIN derives the key using the stored salt and decrypts the PAT with the stored IV.
3. If decryption succeeds:
   * The decrypted PAT is held **strictly in JavaScript application memory** for the duration of the session.
   * The app fetches the latest `students_data.json` from the private GitHub repository.
4. If decryption fails (incorrect PIN):
   * An error is shown ("Incorrect PIN").
   * Zero data is decrypted or displayed.

### 3.3 Session Management & Auto-Lock
* **Auto-Lock Timer:** The session locks automatically after 15 minutes of inactivity (resets on user click/tap/keypress).
* **Manual Lock:** A "Lock" button in the navigation bar immediately flushes the in-memory PAT, wipes state, and returns to the PIN screen.
* **Brute-Force Delay:** Progressive delay (1s, 2s, 4s) after repeated incorrect PIN attempts.

### 3.4 GitHub Token Permissions Recommendation
The user creates a **Fine-Grained Personal Access Token** in GitHub Settings:
* **Repository access:** *Only select repositories* -> Pick only `tutor-fees-data`.
* **Repository permissions:** *Contents: Read and write*.
* All other permissions: *None*.

---

## 4. Canonical Data Schema (`students_data.json`)

The private repository holds a single JSON file formatted as follows:

```json
{
  "version": 1,
  "lastUpdated": "2026-10-20T10:00:00Z",
  "students": [
    {
      "id": "std_18a9fc82-1234-4b56-8a7b-001a2b3c4d5e",
      "name": "Aarav Sharma",
      "gradeOrStandard": "10th - ICSE",
      "fatherName": "Rajesh Sharma",
      "fatherPhone": "+919876543210",
      "motherName": "Sunita Sharma",
      "motherPhone": "+919876543211",
      "address": "42 Lake View Road, Indiranagar, Bengaluru",
      "description": "Mathematics & Physics tuition. 5 PM - 6:30 PM batch.",
      "monthlyFee": 2500,
      "joiningDate": "2026-06-01",
      "isActive": true,
      "feeRecords": {
        "2026-10": {
          "status": "PAID",
          "amountPaid": 2500,
          "paidDate": "2026-10-05",
          "notes": "Paid via UPI"
        },
        "2026-11": {
          "status": "DUE",
          "amountPaid": 0,
          "paidDate": null,
          "notes": ""
        }
      }
    }
  ]
}
```

### TypeScript Data Models
```typescript
export type FeeStatus = 'PAID' | 'DUE' | 'PARTIAL';

export interface FeeRecord {
  status: FeeStatus;
  amountPaid: number;
  paidDate: string | null; // ISO YYYY-MM-DD
  notes: string;
}

export interface Student {
  id: string; // UUID v4
  name: string;
  gradeOrStandard: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  address: string;
  description: string;
  monthlyFee: number;
  joiningDate: string; // ISO YYYY-MM-DD
  isActive: boolean;
  feeRecords: Record<string, FeeRecord>; // Keyed by YYYY-MM (e.g. '2026-10')
}

export interface StudentDatabase {
  version: number;
  lastUpdated: string;
  students: Student[];
}
```

---

## 5. GitHub API Sync Engine

### 5.1 Endpoints & Communication
GitHub's REST API allows direct browser-to-API calls via `fetch()` with CORS support.

1. **Pull Database (`GET`):**
   * **URL:** `https://api.github.com/repos/{owner}/{repo}/contents/students_data.json?ref={branch}`
   * **Headers:**
     ```http
     Authorization: Bearer <IN_MEMORY_PAT>
     Accept: application/vnd.github.v3+json
     ```
   * **Response Handling:**
     * Extract `sha` (git blob hash) and `content` (Base64 string).
     * Decode `content` using standard UTF-8 Base64 decoding (`decodeURIComponent(escape(atob(content)))`).
     * Parse JSON into `StudentDatabase`.
     * Cache both data and `sha` in browser storage for offline usage.

2. **Push Database Changes (`PUT`):**
   * **URL:** `https://api.github.com/repos/{owner}/{repo}/contents/students_data.json`
   * **Headers:** Same as above.
   * **Body:**
     ```json
     {
       "message": "Auto-sync: update student fees records [timestamp]",
       "content": "<base64_encoded_utf8_json>",
       "sha": "<latest_remote_sha>",
       "branch": "main"
     }
     ```
   * **Response:** Returns `200 OK` or `201 Created` with the new git commit `sha`. Local cached `sha` is updated.

3. **Conflict Resolution (`409 Conflict`):**
   * If another commit changed the file, the `sha` will not match.
   * On `409`, fetch latest remote content, merge based on student `id` and newest `feeRecords`, and re-commit.

### 5.2 Sync State Machine
* 🟢 **Synced:** Local changes match remote repository.
* 🟠 **Pending Sync:** Local edits made; sync in progress or queued.
* 🔴 **Sync Error / Offline:** Network failure or invalid token. Changes remain safe in local cache until reconnected.

---

## 6. Progressive Web App (PWA) & Offline Architecture

### 6.1 Web App Manifest (`manifest.json`)
Allows the app to be installed to the home screen or desktop without browser URL bars:
* `name`: "Student Fees Tracker"
* `short_name`: "Fees Tracker"
* `display`: `standalone`
* `start_url`: `.`
* `theme_color`: `#2563EB` (Tailwind Blue-600)
* `background_color`: `#0F172A` (Slate-900)
* High-resolution icons (`192x192`, `512x512`, maskable).

### 6.2 Service Worker
* Built using `vite-plugin-pwa` (Workbox).
* Pre-caches the compiled HTML, CSS, JavaScript, fonts, and icons.
* Offline strategy: **Cache First** for application shell; **Network-first with local fallback** for GitHub API requests.

---

## 7. User Interface & Screen Specifications

Modern, clean, mobile-first responsive design using Tailwind CSS.

### 7.1 Screen Flow
```
┌─────────────────┐       Incorrect PIN
│   Lock Screen   ├────────────────────────┐
└────────┬────────┘                        │
         │ Correct PIN                     ▼
         ▼                       ┌───────────────────┐
┌─────────────────┐              │ Delay / Retry Box │
│ Dashboard (Home)├────────┐     └───────────────────┘
└────────┬────────┘        │
         ├─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌────────────────┐
│ Student Details │ │ Add/Edit    │ │ Settings &     │
│ & Fee Timeline  │ │ Student Form│ │ GitHub Sync    │
└─────────────────┘ └─────────────┘ └────────────────┘
```

### 7.2 Lock & Setup Screens
* **First-Time Setup Screen:** Clean card with input fields for GitHub Username, Repo, PAT, and desired 4-6 digit Master PIN. Includes "Test Connection" button.
* **Unlock Screen:** Minimalist, distraction-free PIN keypad (or input box) with biometric/PIN unlock styling.

### 7.3 Dashboard Screen
* **Header Bar:**
  * App title, Active Month Selector (`< October 2026 >`).
  * Cloud Sync Status Badge (🟢 / 🟠 / 🔴 with last sync timestamp).
  * Quick Lock Button (🔒) & Settings Gear (⚙️).
* **Summary Metrics Grid (3 Cards):**
  * Total Active Students.
  * Collected Fees (Current Month).
  * Pending Amount (Current Month).
* **Filter & Search Bar:**
  * Real-time search by Student Name or Parent Phone.
  * Filter chips: `All`, `Pending Fees`, `Fully Paid`.
* **Student List:**
  * Student Name, Grade/Standard badge.
  * Fee Status Indicator (`PAID` in green, `DUE` in red, `PARTIAL` in amber with remaining balance).
  * Quick 1-tap action: "Mark Paid" toggle directly from card.
  * Click card to open Student Detail View.
* **Floating Action Button (FAB):** `+ Add Student`.

### 7.4 Student Detail View / Modal
* Student Profile Card (Name, Grade, Enrollment Date, Address, Notes).
* **1-Tap Parent Contact Action Row:**
  * Father: Call button (`tel:+91...`) & WhatsApp button (`https://wa.me/...`).
  * Mother: Call button & WhatsApp button.
* **Month-by-Month Fee Record Table / Timeline:**
  * Each month displays: Status (`PAID`/`DUE`/`PARTIAL`), Amount Collected, Date Paid, and Notes/Payment Mode.
  * Quick "Update Fee" dialog to adjust amount, status, or add transaction notes (e.g., "Cash", "GPay Ref 1234").
* Edit Student Profile and Archive/Delete buttons.

### 7.5 Add / Edit Student Modal
* Full form with client-side validation:
  * Full Name (Required).
  * Standard / Grade (Required).
  * Default Monthly Fee (Numeric, Required).
  * Father Name & Phone (with automatic phone formatting).
  * Mother Name & Phone.
  * Residential Address (Multi-line).
  * Internal Notes / Batch details.
  * Joining Date (Defaults to today).

### 7.6 Settings & Backup Screen
* GitHub Connection details (Owner, Repo, Branch).
* Encrypted PAT status ("Configured & Active").
* Change Master PIN option.
* "Sync Now / Force Pull" button.
* **Data Portability:**
  * "Export Backup (JSON)" — Instant download of `students_data.json` to device storage.
  * "Restore / Import from JSON" — Allows recovery if repository credentials change.

---

## 8. GitHub Pages Deployment Workflow

Deployment is fully automated using GitHub Actions. Whenever code is pushed to the `main` branch of the website repository, it builds and deploys to GitHub Pages in seconds.

### 8.1 GitHub Actions Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 9. Recommended Project Structure

```
student-fees-web/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automatic GitHub Pages CI/CD
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── manifest.json               # PWA configuration
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LockScreen.tsx      # PIN keypad / unlock
│   │   │   └── SetupWizard.tsx     # First-time GitHub & PIN setup
│   │   ├── dashboard/
│   │   │   ├── MetricCards.tsx     # Top 3 metric counters
│   │   │   ├── MonthSelector.tsx   # Month picker navigation
│   │   │   ├── FilterBar.tsx       # Search and status filters
│   │   │   └── StudentCard.tsx     # Student summary list card
│   │   ├── students/
│   │   │   ├── StudentModal.tsx    # Add / Edit student form
│   │   │   ├── StudentDetail.tsx   # Full profile & fee history
│   │   │   └── RecordPaymentModal.tsx # Mark payment popup
│   │   ├── settings/
│   │   │   └── SettingsModal.tsx   # Sync, PAT, PIN, and JSON backup
│   │   └── common/
│   │       ├── Header.tsx          # Top bar with sync badge & lock
│   │       └── SyncBadge.tsx       # 🟢/🟠/🔴 sync state indicator
│   ├── services/
│   │   ├── cryptoService.ts        # PBKDF2 + AES-GCM encryption & decryption
│   │   ├── githubService.ts        # GitHub REST API v3 (GET/PUT contents)
│   │   ├── storageService.ts       # Local cache & credential persistence
│   │   └── syncService.ts          # Sync engine & conflict handling
│   ├── context/
│   │   ├── AuthContext.tsx         # In-memory unlocked state & credentials
│   │   └── StudentContext.tsx      # Student state, mutations & search
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces (Student, FeeRecord, etc.)
│   ├── utils/
│   │   ├── dateUtils.ts            # Month formatting, YYYY-MM helpers
│   │   └── exportUtils.ts          # JSON export / import helpers
│   ├── App.tsx                     # Main layout & conditional auth rendering
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Tailwind styles
├── index.html                      # HTML template with PWA meta tags
├── package.json                    # Dependencies & build scripts
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite + PWA + Base URL configuration
├── tailwind.config.js              # Tailwind styling config
└── README.md                       # Setup and usage guide
```

### 9.1 Core NPM Dependencies (`package.json`)
```json
{
  "name": "student-fees-web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.453.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vite-plugin-pwa": "^0.20.5"
  }
}
```

---

## 10. Phased Implementation Roadmap

* **Phase 1: Project Scaffolding & Setup**
  * Initialize Vite + React + TypeScript + Tailwind CSS project.
  * Configure PWA manifest and icons for mobile home-screen installation.
  * Define all TypeScript types (`Student`, `FeeRecord`, `StudentDatabase`, `SyncState`).
* **Phase 2: Cryptographic Engine & Authentication (Approach 1)**
  * Implement `cryptoService.ts` using Web Crypto API (`window.crypto.subtle`):
    * `deriveKey(pin, salt)` via PBKDF2-SHA256.
    * `encrypt(text, pin)` and `decrypt(ciphertext, pin, salt, iv)` via AES-GCM.
  * Build `SetupWizard.tsx` for first-time GitHub configuration and PIN registration.
  * Build `LockScreen.tsx` with numeric keypad and auto-lock after 15 minutes.
* **Phase 3: GitHub REST API & Storage Service**
  * Implement `githubService.ts` (`fetchDatabase`, `saveDatabase`, Base64 UTF-8 handling).
  * Build offline-first cache in `storageService.ts` with local fallback.
  * Implement `syncService.ts` with SHA-based optimistic concurrency control.
* **Phase 4: State Management & UI Components**
  * Implement `StudentContext.tsx` with month navigation and real-time filtering.
  * Build `Header.tsx` with sync status indicator and lock action.
  * Build `MetricCards.tsx` (Active Students, Collected Fees, Due Fees).
  * Build `StudentCard.tsx` with quick fee toggle and parent contact links (`tel:`, WhatsApp).
  * Build `StudentModal.tsx` (Add / Edit student).
  * Build `StudentDetail.tsx` (Month-by-month fee history timeline & payment recorder).
  * Build `SettingsModal.tsx` (Credential updates, Test connection, JSON export/import).
* **Phase 5: GitHub Pages CI/CD & Final Verification**
  * Create `.github/workflows/deploy.yml` for automated GitHub Pages hosting.
  * Test offline workflow (Service Worker caching and offline mutation).
  * Validate end-to-end sync with a private GitHub repository.

---

## 11. Handoff Prompt for Implementation

When ready to begin building this web application, copy and paste the following prompt:

```markdown
Hello! I want to begin implementing the Web Student Fees Tracker (PWA) based on the specification in `WEB_STUDENT_FEES_TRACKER_PLAN.md`.

Here are our locked technical decisions:
1. Static Web App / PWA built with React, TypeScript, Vite, and Tailwind CSS.
2. Hosted for free on GitHub Pages via GitHub Actions.
3. Storage: Private GitHub repository storing `students_data.json` via GitHub REST API v3.
4. Security & Auth (Approach 1): Client-side Master PIN with Web Crypto API (PBKDF2 + AES-GCM) encrypting the GitHub PAT in local storage.
5. Offline-first with Service Worker and local storage cache.

Please guide me through Phase 1: Project Scaffolding & Setup.
```
