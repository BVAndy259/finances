import { Injectable } from '@nestjs/common';
import {
  Algorithm,
  Version,
  hash,
  parseOptions,
  verify,
} from '@node-rs/argon2';

const PASSWORD_HASH_POLICY = {
  algorithm: Algorithm.Argon2id,
  version: Version.V0x13,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

const MIN_SALT_LENGTH = 16;

@Injectable()
export class PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, PASSWORD_HASH_POLICY);
  }

  async verify(hashed: string, password: string): Promise<boolean> {
    return verify(hashed, password).catch(() => false);
  }

  needsRehash(hashed: string): boolean {
    try {
      const options = parseOptions(hashed);

      return (
        options.algorithm !== PASSWORD_HASH_POLICY.algorithm ||
        options.version !== PASSWORD_HASH_POLICY.version ||
        options.memoryCost !== PASSWORD_HASH_POLICY.memoryCost ||
        options.timeCost !== PASSWORD_HASH_POLICY.timeCost ||
        options.parallelism !== PASSWORD_HASH_POLICY.parallelism ||
        options.outputLen !== PASSWORD_HASH_POLICY.outputLen ||
        options.saltLen < MIN_SALT_LENGTH
      );
    } catch {
      return true;
    }
  }
}
