import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate PDF with domcontentloaded and reconnect when browser is disconnected', async () => {
    const pageMock = {
      setContent: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Uint8Array.from([1, 2, 3])),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const disconnectedBrowser = {
      connected: false,
      newPage: jest.fn(),
    };

    const connectedBrowser = {
      connected: true,
      newPage: jest.fn().mockResolvedValue(pageMock),
    };

    (service as unknown as { browser: unknown }).browser = disconnectedBrowser;
    const connectSpy = jest
      .spyOn(
        service as unknown as { connectBrowser: () => Promise<unknown> },
        'connectBrowser',
      )
      .mockResolvedValue(connectedBrowser);

    const buffer = await service.generatePdfFromHtml('<html><body>Ok</body></html>');

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectedBrowser.newPage).toHaveBeenCalledTimes(1);
    expect(pageMock.setContent).toHaveBeenCalledWith(
      '<html><body>Ok</body></html>',
      { waitUntil: 'domcontentloaded', timeout: 60000 },
    );
    expect(pageMock.evaluate).toHaveBeenCalledTimes(1);
    expect(pageMock.pdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
    });
    expect(pageMock.close).toHaveBeenCalledTimes(1);
    expect(buffer).toEqual(Buffer.from([1, 2, 3]));
  });
});
