import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT || '3001', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres',
    schema: process.env.DB_SCHEMA || 'kuph',
  },

  keycloak: {
    authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'kuph',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'kuph-backend',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    frontendClientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID || 'kuph-frontend',
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
  },

  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  },

  aws: {
    endpoint: process.env.AWS_ENDPOINT || process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    ses: {
      fromEmail: process.env.SES_FROM_EMAIL || 'noreply@kuph.app',
    },
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || 'kuph-assets',
    },
  },
}));