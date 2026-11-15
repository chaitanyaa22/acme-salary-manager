import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middleware (configured for Swagger UI compatibility)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    maxAge: 86400, // Cache preflight OPTIONS responses for up to 24h
  });

  // Global API Prefix with Swagger UI routes excluded
  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs/(.*)', 'api/docs', 'api/docs/(.*)'],
  });

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('ACME Global Compensation & Salary Management API')
    .setDescription(
      'Enterprise compensation directory, multi-currency normalization, and transactional salary audit management.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerCustomOptions = {
    customSiteTitle: 'ACME Compensation API Docs',
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css',
    ],
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

await bootstrap();
