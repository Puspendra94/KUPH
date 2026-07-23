import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }

  get isDevEnv(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTestEnv(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return this.configService.get<number>('app.port') || 3001;
  }

  get corsOrigins(): string[] {
    return this.configService.get<string[]>('app.cors.origin') || ['http://localhost:3000'];
  }

  public get(key: string): string | undefined {
    return process.env[key];
  }

  public getNumber(key: string): number {
    return Number(this.get(key));
  }
}