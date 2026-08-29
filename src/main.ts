import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import passport from 'passport';
import { Logger } from 'nestjs-pino';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  const redisClient = createClient({
    url: process.env.REDIS_URL
  });
  redisClient.on('error', (error) => {
    console.error('Redis client error', error);
  });
  await redisClient.connect();
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'sess:'
      }),
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
      cookie: {
        maxAge: +process.env.SESSION_MAX_AGE,
        httpOnly: true
      }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
