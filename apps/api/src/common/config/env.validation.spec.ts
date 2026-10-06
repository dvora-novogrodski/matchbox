import { validate } from './env.validation';

const DATABASE_URL = 'postgresql://matchbox:matchbox@localhost:5432/matchbox';

describe('validate', () => {
  it('should apply defaults when optional variables are missing', () => {
    const env = validate({ DATABASE_URL });

    expect(env.API_PORT).toBe(3000);
    expect(env.WEB_ORIGIN).toEqual(['http://localhost:5173']);
  });

  it('should split WEB_ORIGIN into trimmed origins', () => {
    const env = validate({ DATABASE_URL, WEB_ORIGIN: 'http://a.test, http://b.test' });

    expect(env.WEB_ORIGIN).toEqual(['http://a.test', 'http://b.test']);
  });

  it('should coerce API_PORT to a number', () => {
    const env = validate({ DATABASE_URL, API_PORT: '8080' });

    expect(env.API_PORT).toBe(8080);
  });

  it('should throw when DATABASE_URL is missing', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
  });

  it('should throw when DATABASE_URL is not a postgres url', () => {
    expect(() => validate({ DATABASE_URL: 'mysql://localhost/matchbox' })).toThrow(/DATABASE_URL/);
  });
});
