import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Browser, connect, launch } from 'puppeteer';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(PdfService.name);

  async onModuleInit() {
    await this.ensureBrowser();
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async connectBrowser(): Promise<Browser> {
    const apiKey = process.env.BROWSERLESS_API_KEY;

    if (apiKey) {
      this.logger.log('Conectando ao Browserless.io...');
      const browser = await connect({
        browserWSEndpoint: `wss://production-sfo.browserless.io?token=${apiKey}`,
      });
      this.logger.log('Conexao com Browserless.io estabelecida com sucesso.');
      return browser;
    }

    this.logger.warn(
      'BROWSERLESS_API_KEY nao configurada. Iniciando instancia local do Puppeteer.',
    );
    try {
      const executablePath = process.env.CHROME_EXECUTABLE_PATH;
      const browser = await launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath:
          executablePath && executablePath.trim().length > 0
            ? executablePath
            : undefined,
      });
      this.logger.log('Instancia local do Puppeteer iniciada.');
      return browser;
    } catch (error) {
      this.logger.error('Falha ao iniciar Puppeteer local.', error);
      throw new InternalServerErrorException(
        'Nao foi possivel iniciar o Puppeteer local. Configure BROWSERLESS_API_KEY ou verifique a instalacao do Chrome.',
      );
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (this.browser) {
      this.browser = null;
    }

    try {
      this.browser = await this.connectBrowser();
      return this.browser;
    } catch (error) {
      this.logger.error('FALHA AO CONECTAR COM SERVICO DE PDF:', error);
      throw error;
    }
  }

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    let browser = await this.ensureBrowser();

    let page;
    try {
      page = await browser.newPage();
    } catch (error) {
      this.logger.warn('Falha ao abrir pagina, tentando reconectar...', error);
      this.browser = null;
      browser = await this.ensureBrowser();
      page = await browser.newPage();
    }

    try {
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      // Aguarda a decodificacao de imagens inline (base64) sem depender de networkidle0.
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
          ),
        ),
      );
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdfBuffer);
    } finally {
      await page.close().catch(() => undefined);
    }
  }
}
