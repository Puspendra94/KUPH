import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KeycloakAdapter } from './adapters/keycloak.adapter';
import { KeycloakAdapterMock } from './adapters/keycloak.adapter.mock';

@Module({
  imports: [UserModule, ConfigModule],
  providers: [
    AuthService,
    {
      provide: 'AUTH_SERVICE_PROVIDER',
      useFactory: (configService: ConfigService) => {
        if (process.env.USE_MOCK_KEYCLOAK === 'true') {
          console.log('[AuthModule] Using mock Keycloak adapter for development');
          return new KeycloakAdapterMock();
        }
        return new KeycloakAdapter(configService);
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
