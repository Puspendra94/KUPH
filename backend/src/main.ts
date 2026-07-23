import 'reflect-metadata';

import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  NestExpressApplication,
  ExpressAdapter,
} from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ConfigService } from './shared/services/config.service';
import { SharedModule } from './shared/shared.module';
import { setupSwagger } from './swagger';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      bufferLogs: true,
    },
  );

  // Use nestjs-pino logger
  app.useLogger(app.get(Logger));

  app.enable('trust proxy');

  // Security headers
  app.use(helmet());

  const reflector = app.get(Reflector);
  const configService = app.select(SharedModule).get(ConfigService);

  // CORS — explicit configuration with Chrome Private Network Access support
  const corsOrigins = new Set([...configService.corsOrigins, 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8081']);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && corsOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
    }

    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    next();
  });

  // Compression
  app.use(compression());

  // HTTP request logging
  app.use(morgan('combined'));

  // URI versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter(reflector));

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      dismissDefaultMessages: false,
      validationError: {
        target: true,
        value: true,
      },
    }),
  );

  // Swagger
  if (configService.isDevEnv) {
    setupSwagger(app);
  }

  // Start server
  const port = configService.port;
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`KUPH API running on http://0.0.0.0:${port}/api`);
}

void bootstrap().then();