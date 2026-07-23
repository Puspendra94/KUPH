import { IsString, IsOptional, IsArray } from 'class-validator';

export class ImportExecuteDto {
  @IsString()
  entityType: string;

  @IsArray()
  data: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  mappingConfig?: string;
}
