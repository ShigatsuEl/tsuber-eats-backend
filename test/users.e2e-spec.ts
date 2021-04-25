import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('UserModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it.todo('loginUser');
  it.todo('getUserProfile');
  it.todo('createAccount');
  it.todo('login');
  it.todo('editUserProfile');
  it.todo('verifyEmail');
});