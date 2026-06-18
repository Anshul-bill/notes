import CryptoJS from 'crypto-js';

// Encrypts text using a user-provided password
export const encryptNote = (content: string, password: string) => {
  return CryptoJS.AES.encrypt(content, password).toString();
};

// Decrypts text; returns empty string if password is wrong
export const decryptNote = (cipherText: string, password: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch {
    return null; // Failed to decrypt
  }
};