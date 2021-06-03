import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // AppMoudle은 main.ts로 import되는 유일한 모듈이다.
  // 그렇기 때문에 나중에 모든 것을 Appmoudle로 import될 것이다.
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(4000);
}
bootstrap();
