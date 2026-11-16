import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline/promises';
import {
  AppUser,
  APP_USER_REPOSITORY,
  AppUserRepositoryPort,
} from '@expense-tracker/core';
import { AppModule } from '../app.module';
import { AuthService } from '../application/usecase/auth.service';

process.env.BOT_ENABLED = 'false';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

async function ask(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('La terminal no permite ocultar la contraseña'));
      return;
    }

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    let value = '';

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode?.(Boolean(wasRaw));
      stdin.pause();
    };

    const onData = (data: Buffer) => {
      const char = data.toString('utf8');

      if (char === '\u0003') {
        cleanup();
        process.stdout.write('\n');
        process.exit(130);
      }

      if (char === '\r' || char === '\n') {
        cleanup();
        process.stdout.write('\n');
        resolve(value);
        return;
      }

      if (char === '\u007f' || char === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }

      value += char;
      process.stdout.write('*');
    };

    process.stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function selectUser(users: AppUser[]): Promise<AppUser> {
  console.log('\nUsuarios disponibles:');
  users.forEach((user, index) => {
    const email = user.email ?? 'sin email';
    const telegram = user.telegramChatId ? 'sí' : 'no';
    console.log(
      `${index + 1}) ${user.alias} | email: ${email} | Telegram: ${telegram}`,
    );
  });

  if (users.length === 1) {
    console.log(`\nUsando el único usuario: ${users[0].alias}`);
    return users[0];
  }

  const answer = await ask(`Selecciona un usuario (1-${users.length}): `);
  const index = Number.parseInt(answer, 10) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= users.length) {
    throw new Error('Selección inválida');
  }

  return users[index];
}

async function askEmail(defaultEmail: string | null): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const label = defaultEmail ? `Email [${defaultEmail}]: ` : 'Email: ';
    const answer = await ask(label);
    const email = (answer || defaultEmail || '').trim().toLowerCase();

    if (EMAIL_PATTERN.test(email)) {
      return email;
    }

    console.log('Email inválido. Intenta de nuevo.');
  }

  throw new Error('No se ingresó un email válido');
}

async function askPassword(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const password = await askHidden('Contraseña: ');

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.log(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      continue;
    }

    const confirmation = await askHidden('Confirma la contraseña: ');

    if (password !== confirmation) {
      console.log('Las contraseñas no coinciden.');
      continue;
    }

    return password;
  }

  throw new Error('No se ingresó una contraseña válida');
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userRepository = app.get<AppUserRepositoryPort>(APP_USER_REPOSITORY);
    const authService = app.get(AuthService);

    const users = await userRepository.findAll();

    if (users.length === 0) {
      throw new Error('No hay usuarios registrados');
    }

    const user = await selectUser(users);

    if (user.email || user.passwordHash) {
      const overwrite = await ask(
        `\n${user.alias} ya tiene credenciales (${user.email ?? 'sin email'}). ¿Sobrescribir? (s/N): `,
      );

      if (!/^s$/i.test(overwrite)) {
        console.log('Operación cancelada.');
        return;
      }
    }

    const email = await askEmail(user.email);
    const password = await askPassword();

    await authService.setInitialCredentials(user.id!, email, password);

    console.log(
      `\nListo. ${user.alias} ahora puede iniciar sesión con ${email}.`,
    );
    console.log(
      'Telegram, cuentas, transacciones y préstamos se mantienen intactos.',
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nError: ${message}`);
  process.exitCode = 1;
});
