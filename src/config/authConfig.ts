/**
 * =========================================================================
 * 🔑 USER AUTHENTICATION & GITHUB CONFIGURATION
 * =========================================================================
 * You can manually edit the username, password, and GitHub sync settings below.
 *
 * 1. USERNAME & PASSWORD:
 *    These are the credentials checked when logging in on the initial screen.
 *
 * 2. GITHUB SETTINGS (Optional):
 *    If you want your student fees data to automatically sync to a private GitHub
 *    repository, fill in your GitHub details below.
 *    If left blank, the app will store data locally in your browser.
 */

export const AUTH_CONFIG = {
  // 👉 EDIT YOUR LOGIN CREDENTIALS HERE:
  USERNAME: 'admin',
  PASSWORD: 'password123',

  // 👉 EDIT YOUR GITHUB SETTINGS HERE (OPTIONAL):
  GITHUB: {
    OWNER: '',      // e.g. 'your-github-username'
    REPO: '',       // e.g. 'tutor-fees-data'
    BRANCH: 'main', // default branch
    PAT: ''         // e.g. 'github_pat_...'
  }
};
