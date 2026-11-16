import { Algorithm, Version, hash } from '@node-rs/argon2';
import { PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  let hasher: PasswordHasher;

  beforeEach(() => {
    hasher = new PasswordHasher();
  });

  it('genera hashes Argon2id con la política actual', async () => {
    const hashed = await hasher.hash('secret123');

    expect(hashed).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hashed = await hasher.hash('secret123');

    await expect(hasher.verify(hashed, 'secret123')).resolves.toBe(true);
    await expect(hasher.verify(hashed, 'wrong-password')).resolves.toBe(false);
  });

  it('no requiere rehash para hashes con la política actual', async () => {
    const hashed = await hasher.hash('secret123');

    expect(hasher.needsRehash(hashed)).toBe(false);
  });

  it('requiere rehash cuando cambian los parámetros', async () => {
    const weaker = await hash('secret123', {
      algorithm: Algorithm.Argon2id,
      version: Version.V0x13,
      memoryCost: 1024,
      timeCost: 1,
      parallelism: 1,
      outputLen: 32,
    });

    expect(hasher.needsRehash(weaker)).toBe(true);
  });

  it('requiere rehash cuando el hash es inválido', () => {
    expect(hasher.needsRehash('not-a-hash')).toBe(true);
  });
});
