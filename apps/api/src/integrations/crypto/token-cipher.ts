import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function parseEncryptionKey(encoded: string): Buffer {
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32) {
        throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64');
    }
    return key;
}

export function encryptToken(plaintext: string, key: Buffer): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptToken(payload: string, key: Buffer): string {
    const raw = Buffer.from(payload, 'base64');
    if (raw.length <= IV_LENGTH + TAG_LENGTH) {
        throw new Error('Encrypted token is malformed');
    }
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
