/**
 * Client-Side Cryptographic Service using Web Crypto API
 * PBKDF2 (SHA-256, 100,000 iterations) + AES-GCM-256
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64
  salt: string; // Base64 (16 bytes)
  iv: string; // Base64 (12 bytes)
}

// Convert Uint8Array to Base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Safely encode UTF-8 string to Base64 (Unicode safe)
export function utf8ToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return uint8ArrayToBase64(bytes);
}

// Safely decode Base64 to UTF-8 string (Unicode safe)
export function base64ToUtf8(base64: string): string {
  const bytes = base64ToUint8Array(base64);
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Derive an AES-GCM CryptoKey from a PIN and salt using PBKDF2
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    pinBuffer as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plain text (e.g. GitHub PAT) with Master PIN
 */
export async function encryptWithPin(plaintext: string, pin: string): Promise<EncryptedPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    data as unknown as BufferSource
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv)
  };
}

/**
 * Decrypts ciphertext with Master PIN, salt, and IV
 * Throws error if PIN is incorrect or payload corrupted
 */
export async function decryptWithPin(
  ciphertextBase64: string,
  pin: string,
  saltBase64: string,
  ivBase64: string
): Promise<string> {
  const salt = base64ToUint8Array(saltBase64);
  const iv = base64ToUint8Array(ivBase64);
  const ciphertext = base64ToUint8Array(ciphertextBase64);

  const key = await deriveKey(pin, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(decryptedBuffer);
}
