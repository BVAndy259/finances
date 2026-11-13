import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PingController } from '../src/interfaces/controllers/ping.controller';

describe('PingController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / responde el mensaje de keep-alive', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('El servidor del bot está despierto y funcionando.');
  });
});
