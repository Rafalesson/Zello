import { Controller, Get, NotFoundException, UseGuards, Header } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('consent')
export class ConsentTermsController {
  constructor(private readonly consentService: ConsentService) {}

  @Get('active-terms')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getActiveTerms() {
    const activeTerms = await this.consentService.getActiveTerms();
    if (!activeTerms) {
      throw new NotFoundException('Nenhum termo legal ativo encontrado.');
    }
    return activeTerms;
  }
}
