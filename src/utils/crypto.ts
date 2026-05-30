/**
 * Web Crypto API wrapper for AES-GCM encryption
 * Powered entirely in the client browser. Nothing is ever sent to any server.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to Hex
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex to ArrayBuffer
function hexToBuffer(hex: string): ArrayBuffer {
  const matches = hex.match(/.{1,2}/g) || [];
  const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
  return bytes.buffer;
}

// Generate random bytes for salt or IV
export function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

// Generate a random IV as Hex
export function generateRandomHexSalt(length = 16): string {
  const bytes = generateRandomBytes(length);
  return bufferToHex(bytes.buffer);
}

/**
 * Derives an AES-GCM cryptographic key from a master password and salt using PBKDF2
 */
async function deriveAesKey(password: string, saltHex: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = hexToBuffer(saltHex);

  // Import raw password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES 256-bit key from the password material and salt
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts cleartext string using AES-GCM with derived key
 */
export async function encryptText(plaintext: string, password: string, saltHex: string): Promise<string> {
  const aesKey = await deriveAesKey(password, saltHex);
  const iv = generateRandomBytes(12); // standard 96-bit AES-GCM IV
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    dataBuffer
  );

  // Return IV (hex) + "." + ciphertext (base64)
  const ivHex = bufferToHex(iv.buffer);
  const ciphertextBase64 = bufferToBase64(ciphertextBuffer);

  return `${ivHex}.${ciphertextBase64}`;
}

/**
 * Decrypts structured AES-GCM ciphertext using derived key
 */
export async function decryptText(encryptedCombined: string, password: string, saltHex: string): Promise<string> {
  const parts = encryptedCombined.split('.');
  if (parts.length !== 2) {
    throw new Error('Định dạng dữ liệu mã hóa không hợp lệ.');
  }

  const [ivHex, ciphertextBase64] = parts;
  const aesKey = await deriveAesKey(password, saltHex);
  const ivBuffer = hexToBuffer(ivHex);
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    aesKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
