import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppLogger } from './common/logger/app.logger';

async function bootstrap() {
  const appLogger = new AppLogger();

  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
  });

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000']
      : ['http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Delivery Management Microservice')
    .setDescription(
      'REST API for managing driver delivery routes. ' +
        'Allows registering the start and end of a delivery route, ' +
        'showcasing best practices in architecture, validation and state management in NestJS.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, '0.0.0.0');

  const appUrl = await app.getUrl();

  appLogger.success(`API running on ${appUrl}/api`);
  appLogger.debug(`Swagger docs on ${appUrl}/api/docs`);
}

void bootstrap();
