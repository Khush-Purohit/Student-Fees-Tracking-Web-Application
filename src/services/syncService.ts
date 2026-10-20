import { Student, StudentDatabase, GitHubConfig } from '../types';
import { githubService } from './githubService';
import { storageService, INITIAL_DATABASE } from './storageService';

export interface SyncOutcome {
  success: boolean;
  database: StudentDatabase;
  error?: string;
}

/**
 * Merges two versions of StudentDatabase in case of conflict.
 * Merges students by ID and resolves feeRecords by taking non-empty / paid updates.
 */
export function mergeDatabases(local: StudentDatabase, remote: StudentDatabase): StudentDatabase {
  const mergedStudentMap = new Map<string, Student>();

  // Add all remote students
  for (const s of remote.students) {
    mergedStudentMap.set(s.id, { ...s });
  }

  // Merge or add local students
  for (const localStudent of local.students) {
    const remoteStudent = mergedStudentMap.get(localStudent.id);
    if (!remoteStudent) {
      mergedStudentMap.set(localStudent.id, { ...localStudent });
    } else {
      // Merge fee records
      const mergedFeeRecords = { ...remoteStudent.feeRecords };
      for (const [month, localRecord] of Object.entries(localStudent.feeRecords)) {
        const remoteRecord = mergedFeeRecords[month];
        if (!remoteRecord) {
          mergedFeeRecords[month] = localRecord;
        } else {
          // If local has payment or later paidDate, prefer local
          if (localRecord.status === 'PAID' || (localRecord.amountPaid > (remoteRecord.amountPaid || 0))) {
            mergedFeeRecords[month] = localRecord;
          }
        }
      }

      mergedStudentMap.set(localStudent.id, {
        ...remoteStudent,
        ...localStudent,
        feeRecords: mergedFeeRecords
      });
    }
  }

  return {
    version: Math.max(local.version, remote.version),
    lastUpdated: new Date().toISOString(),
    students: Array.from(mergedStudentMap.values())
  };
}

export const syncService = {
  /**
   * Pulls the latest database from GitHub and updates local cache.
   */
  async pull(pat: string, config: GitHubConfig): Promise<SyncOutcome> {
    try {
      const result = await githubService.fetchDatabase(
        config.owner,
        config.repo,
        config.branch,
        pat
      );

      if (result.notFound) {
        // File does not exist yet. Initialize it with empty database!
        const initDb: StudentDatabase = storageService.getCachedDatabase() || INITIAL_DATABASE;
        const saveRes = await githubService.saveDatabase(
          config.owner,
          config.repo,
          config.branch,
          pat,
          initDb,
          null,
          'Initial commit: setup students_data.json'
        );

        if (saveRes.success && saveRes.newSha) {
          storageService.setRemoteSha(saveRes.newSha);
        }
        storageService.setCachedDatabase(initDb);
        storageService.setPendingSync(false);

        return { success: true, database: initDb };
      }

      if (result.data) {
        const localCache = storageService.getCachedDatabase();
        let finalDb = result.data;

        // If we had pending unpushed changes locally, merge them
        if (storageService.hasPendingSync() && localCache) {
          finalDb = mergeDatabases(localCache, result.data);
          // And push the merged result back
          await this.push(finalDb, pat, config);
        } else {
          storageService.setCachedDatabase(finalDb);
          if (result.sha) {
            storageService.setRemoteSha(result.sha);
          }
          storageService.setPendingSync(false);
        }

        return { success: true, database: finalDb };
      }

      throw new Error('No data received from GitHub.');
    } catch (err) {
      // Fallback to local cache if offline or error
      const cached = storageService.getCachedDatabase();
      return {
        success: false,
        database: cached || INITIAL_DATABASE,
        error: err instanceof Error ? err.message : 'Sync pull failed'
      };
    }
  },

  /**
   * Pushes database changes to GitHub with conflict detection and auto-merge.
   */
  async push(
    database: StudentDatabase,
    pat: string,
    config: GitHubConfig
  ): Promise<SyncOutcome> {
    // 1. Immediately cache locally
    database.lastUpdated = new Date().toISOString();
    storageService.setCachedDatabase(database);
    storageService.setPendingSync(true);

    try {
      let currentSha = storageService.getRemoteSha();

      // If we don't have a SHA, try fetching to see if the file already exists on GitHub
      if (!currentSha) {
        const fetchRes = await githubService.fetchDatabase(
          config.owner,
          config.repo,
          config.branch,
          pat
        );
        if (fetchRes.sha) {
          currentSha = fetchRes.sha;
          storageService.setRemoteSha(currentSha);
        }
      }

      const saveRes = await githubService.saveDatabase(
        config.owner,
        config.repo,
        config.branch,
        pat,
        database,
        currentSha
      );

      if (saveRes.success && saveRes.newSha) {
        storageService.setRemoteSha(saveRes.newSha);
        storageService.setPendingSync(false);
        return { success: true, database };
      }

      // Handle Conflict (409)
      if (saveRes.conflict) {
        // Fetch remote version
        const remoteRes = await githubService.fetchDatabase(
          config.owner,
          config.repo,
          config.branch,
          pat
        );

        if (remoteRes.data && remoteRes.sha) {
          const resolved = mergeDatabases(database, remoteRes.data);
          const retryRes = await githubService.saveDatabase(
            config.owner,
            config.repo,
            config.branch,
            pat,
            resolved,
            remoteRes.sha,
            'Auto-sync: resolved conflict merge'
          );

          if (retryRes.success && retryRes.newSha) {
            storageService.setCachedDatabase(resolved);
            storageService.setRemoteSha(retryRes.newSha);
            storageService.setPendingSync(false);
            return { success: true, database: resolved };
          }
        }
      }

      throw new Error(saveRes.error || 'Failed to push to GitHub');
    } catch (err) {
      return {
        success: false,
        database,
        error: err instanceof Error ? err.message : 'Sync push failed'
      };
    }
  }
};
