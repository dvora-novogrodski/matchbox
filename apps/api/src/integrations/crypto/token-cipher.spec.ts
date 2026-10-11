import { randomBytes } from 'node:crypto';

import { decryptToken, encryptToken, parseEncryptionKey } from './token-cipher';

describe('token cipher', () => {
    const key = parseEncryptionKey(randomBytes(32).toString('base64'));

    it('should round-trip a token', () => {
        const encrypted = encryptToken('ghp_example', key);

        expect(decryptToken(encrypted, key)).toBe('ghp_example');
        expect(encrypted).not.toContain('ghp_example');
    });

    it('should reject a tampered payload', () => {
        const encrypted = Buffer.from(encryptToken('ghp_example', key), 'base64');
        encrypted[encrypted.length - 1] ^= 1;

        expect(() => decryptToken(encrypted.toString('base64'), key)).toThrow();
    });

    it('should reject a key that is not 32 bytes', () => {
        expect(() => parseEncryptionKey(Buffer.from('short').toString('base64'))).toThrow(/32 bytes/);
    });
});
