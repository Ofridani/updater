import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Updater API')
    .setDescription(
      'API for publishing alerts, serving stream-filtered alert feeds, and tracking alert views.',
    )
    .setVersion('0.1.0')
    .addTag('health', 'Application health and bootstrap information')
    .addTag('alerts', 'Alert publishing and alert feed endpoints')
    .addTag('alert-views', 'Alert view tracking endpoints')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = process.env.SWAGGER_PATH?.trim() || 'docs';
  SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
    customSiteTitle: 'Updater API Docs',
    jsonDocumentUrl: `${swaggerPath}-json`,
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
