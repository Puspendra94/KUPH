import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

export function setupSwagger(app: INestApplication) {
  const serverUrl = `http://localhost:${process.env.APP_PORT || '3001'}`;
  const options = new DocumentBuilder()
    .setTitle('KUPH API')
    .setDescription('REST API for KUPH Influencer Marketing Platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer(serverUrl)
    .build();

  const document = SwaggerModule.createDocument(app, options);
  fs.writeFileSync('./swagger-doc.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api/docs', app, document);
}