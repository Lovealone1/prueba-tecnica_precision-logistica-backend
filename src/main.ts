import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as chalk from 'chalk';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Precisión Logística API')
    .setDescription('API para la prueba técnica de desarrollo backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  Logger.log(
    chalk.green(`Servidor inicializado en `) + chalk.cyan(`http://localhost:${port}`),
    'Bootstrap',
  );
  Logger.log(
    chalk.green(`Documentación Swagger en `) + chalk.cyan(`http://localhost:${port}/api`),
    'Bootstrap',
  );
}
bootstrap();
