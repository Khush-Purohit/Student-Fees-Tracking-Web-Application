# Student Fees Tracker (PWA)

A private, lightning-fast, and zero-cost Progressive Web App (PWA) built for solo educators and private tutors to manage student profiles, monitor monthly fee cycles, and synchronize records securely via GitHub.

Hosted for free on **GitHub Pages**, backed by a **Private GitHub Repository** (`students_data.json`), and secured with **Client-Side Master PIN / AES-GCM-256 encryption**.

---

## 🌟 Key Features

* **Zero Hosting Cost:** Runs 100% statically on GitHub Pages with automated CI/CD deployment on `git push`.
* **Zero Database Fees:** Uses your private GitHub repository as a persistent, version-controlled cloud database via GitHub REST API v3.
* **Client-Side Cryptography (Web Crypto API):**
  * Your GitHub Personal Access Token (PAT) is encrypted in `localStorage` using **AES-GCM-256** with a key derived via **PBKDF2-SHA256 (100,000 iterations)**.
  * The raw PAT is decrypted strictly in memory upon PIN entry and flushed immediately on lock or page close.
* **Progressive Web App (PWA) & Offline-First:**
  * Installable on iOS Safari, Android Chrome, and desktop browsers.
  * Service worker pre-caches assets for offline accessibility.
  * Local mutations are queued and synchronized automatically when online.
* **Tutor Dashboard & Analytics:**
  * Total active students counter.
  * Fees collected vs. pending balance for any selected calendar month.
  * Month selector navigation (`< October 2026 >`).
  * Real-time search by student name, standard, or parent phone number.
  * Filter chips: `All`, `Pending`, `Paid`.
* **Student Directory & Profile:**
  * Add, edit, and archive students with full academic and contact records.
  * 1-tap parent contact buttons: Phone Call (`tel:`) and WhatsApp (`https://wa.me/`).
  * 12-month fee ledger timeline with status, amount collected, payment date, and transaction notes.
* **Instant Payment Logging:**
  * Quick 1-tap "Mark Paid" toggle directly from cards.
  * Record payment modal for partial payments, custom payment modes ("UPI", "Cash"), and timestamps.
* **Data Portability:**
  * 1-click **JSON Backup Export** to device storage.
  * 1-click **JSON Backup Restore** with structure validation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Git](https://git-scm.com/)
* A GitHub account

### 2. Local Development
```bash
# Clone the repository
git clone <repo-url>
cd "Student Fees Tracker Web Application"

# Install dependencies
npm install

# Start local development server
npm run dev
```

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🔐 First-Time Setup & GitHub Sync Configuration

When you first launch the app, you will see the **Setup Wizard** (or choose **Explore Demo Mode** for immediate testing).

### Step 1: Create a Private Data Repository
1. On GitHub, create a new **Private** repository (e.g. `tutor-fees-data`).
2. You do not need to create any files manually; the app will initialize `students_data.json` automatically on your first save.

### Step 2: Generate a Fine-Grained Personal Access Token (PAT)
1. Go to **GitHub Settings** &gt; **Developer Settings** &gt; **Personal access tokens** &gt; **Fine-grained tokens**.
2. Click **Generate new token**.
3. Under **Repository access**, select *Only select repositories* and pick your private repository (e.g. `tutor-fees-data`).
4. Under **Repository permissions**, find **Contents** and set access to **Read and write**.
5. Copy the generated token (`github_pat_...`).

### Step 3: Configure the Web App
1. Enter your GitHub Username / Owner, Repository Name, and Token in the Setup Wizard.
2. Click **Test GitHub Connection** to verify access.
3. Choose a **4 to 8 digit Master PIN**.
4. Click **Save Credentials & Launch App**.

---

## 🌐 Deploying to GitHub Pages

This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push this repository to a public or private GitHub repository.
2. In your repository on GitHub, go to **Settings** &gt; **Pages**.
3. Under **Build and deployment** &gt; **Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build the PWA and deploy it to `https://<username>.github.io/<repo-name>/`.

---

## 🛡️ Security Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PUBLIC GITHUB PAGES (Static UI)                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                         LOCK SCREEN                            │   │
│   │                 Enter 4-8 Digit Master PIN                     │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ PBKDF2 (100,000 rounds)            │
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
                                    │ HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PRIVATE GITHUB REPOSITORY                          │
│               Contains ONLY: /students_data.json                       │
└────────────────────────────────────────────────────────────────────────┘
```

* **No Plain-Text Secrets:** The GitHub Personal Access Token is never stored in plain text anywhere on disk or in browser storage.
* **Auto-Lock:** The application locks automatically after 15 minutes of inactivity (customizable in Settings).
* **Brute-Force Protection:** Progressive delays are enforced on incorrect PIN attempts.
* **Manual Lock:** A single click on 🔒 flushes all memory keys and immediately locks the screen.

---

## 📁 Canonical Data Schema (`students_data.json`)

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
        }
      }
    }
  ]
}
```

---

## 📜 License
MIT License. Built with ❤️ for independent educators everywhere.
