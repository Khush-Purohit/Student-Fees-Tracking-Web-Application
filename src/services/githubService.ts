import { StudentDatabase } from '../types';
import { utf8ToBase64, base64ToUtf8 } from './cryptoService';

export interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding?: string;
}

export interface FetchResult {
  data: StudentDatabase | null;
  sha: string | null;
  notFound: boolean;
}

export interface SaveResult {
  success: boolean;
  newSha?: string;
  conflict?: boolean;
  error?: string;
}

export const githubService = {
  /**
   * Test if the GitHub credentials are valid and repository is reachable
   */
  async testConnection(
    owner: string,
    repo: string,
    branch = 'main',
    pat: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Verify repository access
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${pat.trim()}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!repoRes.ok) {
        if (repoRes.status === 401) {
          return { success: false, error: 'Invalid GitHub Personal Access Token (401 Unauthorized).' };
        }
        if (repoRes.status === 404) {
          return { success: false, error: `Repository "${owner}/${repo}" was not found or token lacks access.` };
        }
        return { success: false, error: `GitHub API error: ${repoRes.status} ${repoRes.statusText}` };
      }

      // 2. Verify branch
      const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
        headers: {
          Authorization: `Bearer ${pat.trim()}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!branchRes.ok && branchRes.status !== 404) {
        return { success: false, error: `Branch "${branch}" check returned: ${branchRes.statusText}` };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error connecting to GitHub'
      };
    }
  },

  /**
   * Fetch students_data.json from the repository
   */
  async fetchDatabase(
    owner: string,
    repo: string,
    branch = 'main',
    pat: string
  ): Promise<FetchResult> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/students_data.json?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${pat.trim()}`,
        Accept: 'application/vnd.github.v3+json'
      },
      cache: 'no-store'
    });

    if (res.status === 404) {
      return { data: null, sha: null, notFound: true };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `GitHub error fetching file: ${res.statusText}`);
    }

    const json: GitHubFileResponse = await res.json();
    // GitHub API might include newlines in base64 content
    const sanitizedContent = (json.content || '').replace(/\n/g, '');
    const decodedText = base64ToUtf8(sanitizedContent);
    const parsedData: StudentDatabase = JSON.parse(decodedText);

    return {
      data: parsedData,
      sha: json.sha,
      notFound: false
    };
  },

  /**
   * Push changes to students_data.json
   */
  async saveDatabase(
    owner: string,
    repo: string,
    branch = 'main',
    pat: string,
    data: StudentDatabase,
    sha: string | null,
    commitMessage?: string
  ): Promise<SaveResult> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/students_data.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const contentBase64 = utf8ToBase64(jsonString);

    const payload: Record<string, unknown> = {
      message: commitMessage || `Auto-sync: update student fees records [${new Date().toISOString()}]`,
      content: contentBase64,
      branch: branch
    };

    if (sha) {
      payload.sha = sha;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${pat.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      return { success: false, conflict: true, error: 'Remote file was modified by another session (409 Conflict).' };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.message || `Failed to save to GitHub (${res.status} ${res.statusText})`
      };
    }

    const resJson = await res.json();
    const newSha = resJson.content?.sha || resJson.commit?.sha;

    return {
      success: true,
      newSha
    };
  }
};
