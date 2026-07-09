import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(
    fastifyCookie as unknown as Parameters<typeof app.register>[0],
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove extra fields that are not in the DTO
      forbidNonWhitelisted: true, // throw an error if extra fields are present
      transform: true, // automatically transform payloads to be objects typed according to their DTO classes
    }),
  );

  await app.listen({
    port: 3003,
    host: '0.0.0.0',
  });
}
void bootstrap();
