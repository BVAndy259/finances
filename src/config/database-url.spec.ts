import { normalizeDatabaseUrl } from './database-url';

describe('normalizeDatabaseUrl', () => {
  it('quita sslmode en hosts locales', () => {
    const url =
      'postgresql://user:pass@localhost:5432/finances_db?sslmode=require';

    expect(normalizeDatabaseUrl(url)).toBe(
      'postgresql://user:pass@localhost:5432/finances_db',
    );
  });

  it('mantiene sslmode en hosts remotos', () => {
    const url =
      'postgresql://user:pass@db.example.com:5432/finances_db?sslmode=require';

    expect(normalizeDatabaseUrl(url)).toBe(url);
  });

  it('mantiene otros parámetros al quitar sslmode', () => {
    const url =
      'postgresql://user:pass@127.0.0.1:5432/finances_db?sslmode=require&application_name=api';

    expect(normalizeDatabaseUrl(url)).toBe(
      'postgresql://user:pass@127.0.0.1:5432/finances_db?application_name=api',
    );
  });

  it('devuelve undefined cuando no hay URL', () => {
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined();
  });
});
