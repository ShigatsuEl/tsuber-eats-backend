import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';
import { response } from 'express';

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'shigatsu@gmail.com',
  password: 'kimiuso',
};

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationsRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Owner
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Owner
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                createAccount: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('There is a user with that email already');
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
          }) {
            ok
            error
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "wrongPassword",
          }) {
            ok
            error
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Password does not match');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('getUserProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(`
        query {
          getUserProfile(userId: ${userId}) {
            ok
            error
            user {
              id
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getUserProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return privateTest(`
        query {
          getUserProfile(userId: 999) {
            ok
            error
            user {
              id
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getUserProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User not found');
          expect(user).toBe(null);
        });
    });
  });

  describe('loginUser', () => {
    it('should return login user', () => {
      return privateTest(`
        query {
          loginUser {
            email
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                loginUser: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
        query {
          loginUser {
            email
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              errors: [{ message }],
            },
          } = res;
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('editUserProfile', () => {
    const NEW_EMAIL = 'shigatsu@new.com';
    it('should change email', () => {
      return privateTest(`
        mutation {
          editUserProfile(input: {
            email: "${NEW_EMAIL}"
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editUserProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have new email', () => {
      return privateTest(`
        query {
          loginUser {
            email
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                loginUser: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });

    it('should change password', () => {
      return privateTest(`
        mutation {
          editUserProfile(input: {
            password: "1234"
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editUserProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
        mutation {
          verifyEmail(input: {
            code: "${verificationCode}"
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on verification code not found', () => {
      return publicTest(`
        mutation {
          verifyEmail(input: {
            code: ""
          }) {
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
