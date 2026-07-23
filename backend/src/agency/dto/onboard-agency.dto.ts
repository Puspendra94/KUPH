import { IsString, IsEmail, IsOptional } from 'class-validator';

export class OnboardAgencyDto {
  @IsString()
  agencyName: string;

  @IsEmail()
  email: string;
}
