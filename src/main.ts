import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configDotenv } from 'dotenv';
configDotenv();
import { env } from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT || 3001);
}
bootstrap();
