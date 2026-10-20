import { StudentDatabase } from '../types';

export function exportToJsonFile(data: StudentDatabase, filename = 'students_data_backup.json'): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseJsonFile(file: File): Promise<StudentDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.students)) {
          throw new Error('Invalid student database JSON structure. Must contain a "students" array.');
        }
        resolve(parsed as StudentDatabase);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Sanitizes phone numbers for WhatsApp and direct calling.
 * WhatsApp wa.me requires digits only, with country code (e.g., 919876543210).
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters except leading plus
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // Default assumption for 10-digit Indian numbers without country code
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export function formatPhoneForTel(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}
