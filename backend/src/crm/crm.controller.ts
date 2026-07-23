import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import * as XLSX from 'xlsx';
import { CrmService } from './crm.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UploadedFileType {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('import/execute')
  @UseInterceptors(FileInterceptor('file'))
  async importExecute(
    @UploadedFile() file: UploadedFileType,
    @Body('entityType') entityType: string,
    @Req() req: Request,
    @CurrentUser() user?: { id: string; agencyId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const agencyId =
      user?.agencyId ||
      (req.query?.agency_id as string) ||
      process.env.DEFAULT_AGENCY_ID ||
      'default-agency';

    // Parse the file using SheetJS — only first 20 rows for preview,
    // full file for actual import
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('File has no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

    if (jsonData.length === 0) {
      throw new BadRequestException('File is empty');
    }

    // Normalize headers to lowercase
    const normalizedData = jsonData.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key.trim().toLowerCase()] = String(value ?? '').trim();
      }
      return normalized;
    });

    return this.crmService.importExecute(agencyId, normalizedData, entityType || 'influencer');
  }

  @Get('influencers')
  async getInfluencers(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: { id: string; agencyId?: string },
  ) {
    const agencyId =
      user?.agencyId ||
      (req.query?.agency_id as string) ||
      process.env.DEFAULT_AGENCY_ID ||
      'default-agency';
    return this.crmService.getInfluencers(agencyId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('clients')
  async getClients(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: { id: string; agencyId?: string },
  ) {
    const agencyId =
      user?.agencyId ||
      (req.query?.agency_id as string) ||
      process.env.DEFAULT_AGENCY_ID ||
      'default-agency';
    return this.crmService.getClients(agencyId, Number(page) || 1, Number(limit) || 20);
  }
}
