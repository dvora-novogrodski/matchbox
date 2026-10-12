import { validate } from './env.validation';

const DATABASE_URL = 'postgresql://matchbox:matchbox@localhost:5432/matchbox';

describe('validate', () => {
  it('should apply defaults when optional variables are missing', () => {
    const env = validate({ DATABASE_URL });

    expect(env.API_PORT).toBe(3000);
    expect(env.WEB_ORIGIN).toEqual(['http://localhost:5173']);
    expect(env.FIREBASE_PROJECT_ID).toBe('demo-matchbox');
    expect(env.AI_TIMEOUT_MS).toBe(15_000);
    expect(env.AI_SERVICE_URL).toBeUndefined();
  });

  it('should split WEB_ORIGIN into trimmed origins', () => {
    const env = validate({ DATABASE_URL, WEB_ORIGIN: 'http://a.test, http://b.test' });

    expect(env.WEB_ORIGIN).toEqual(['http://a.test', 'http://b.test']);
  });

  it('should coerce API_PORT to a number', () => {
    const env = validate({ DATABASE_URL, API_PORT: '8080' });

    expect(env.API_PORT).toBe(8080);
  });

  it('should use the local Firebase project when FIREBASE_PROJECT_ID is empty', () => {
    const env = validate({ DATABASE_URL, FIREBASE_PROJECT_ID: '' });

    expect(env.FIREBASE_PROJECT_ID).toBe('demo-matchbox');
  });

  it('should treat an empty token key and chrome path as unset', () => {
    const env = validate({ DATABASE_URL, TOKEN_ENCRYPTION_KEY: '', CHROME_PATH: '', AI_SERVICE_URL: '' });

    expect(env.TOKEN_ENCRYPTION_KEY).toBeUndefined();
    expect(env.CHROME_PATH).toBeUndefined();
    expect(env.AI_SERVICE_URL).toBeUndefined();
  });

  it('should throw when DATABASE_URL is missing', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
  });

  it('should throw when DATABASE_URL is not a postgres url', () => {
    expect(() => validate({ DATABASE_URL: 'mysql://localhost/matchbox' })).toThrow(/DATABASE_URL/);
  });
});
