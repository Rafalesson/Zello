import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly certificatesFolder = 'certificates';
  private readonly prescriptionsFolder = 'prescriptions';
  private readonly profilePicturesFolder = 'profile-pictures';
  private readonly isConfigured: boolean;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Ignora a configuracao quando as credenciais estao ausentes para permitir que o app suba localmente.
    if (!cloudName || !apiKey || !apiSecret) {
      this.isConfigured = false;
      console.warn(
        'Cloudinary credentials are not configured. File uploads will fail until CLOUDINARY_* variables are provided.',
      );
      return;
    }

    // Configura o cliente global da Cloudinary uma unica vez usando as variaveis de ambiente.
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.isConfigured = true;
  }

  // Envia foto de perfil (imagem) para a Cloudinary com transformacoes automaticas.
  async uploadProfilePicture(
    buffer: Buffer,
    identifier: string,
  ): Promise<UploadApiResponse> {
    this.ensureConfigured();
    const publicId = `${this.profilePicturesFolder}/${identifier}`;
    return this.uploadImage(buffer, { publicId });
  }

  // Envia o buffer PDF para a pasta de certificados mantendo o id do registro como public id.
  async uploadCertificatePdf(
    buffer: Buffer,
    identifier: string,
  ): Promise<UploadApiResponse> {
    this.ensureConfigured();
    const publicId = `${this.certificatesFolder}/${identifier}`;
    return this.uploadRaw(buffer, { publicId, format: 'pdf' });
  }

  // Envia o buffer PDF para a pasta de receitas mantendo o id do registro como public id.
  async uploadPrescriptionPdf(
    buffer: Buffer,
    identifier: string,
  ): Promise<UploadApiResponse> {
    this.ensureConfigured();
    const publicId = `${this.prescriptionsFolder}/${identifier}`;
    return this.uploadRaw(buffer, { publicId, format: 'pdf' });
  }

  // Remove um PDF de atestado previamente enviado a partir da URL da Cloudinary.
  async deleteCertificatePdfByUrl(
    url: string | null | undefined,
  ): Promise<void> {
    await this.deleteAssetByUrl(url, this.certificatesFolder);
  }

  // Remove um PDF de receita previamente enviado a partir da URL da Cloudinary.
  async deletePrescriptionPdfByUrl(
    url: string | null | undefined,
  ): Promise<void> {
    await this.deleteAssetByUrl(url, this.prescriptionsFolder);
  }

  // Permite que outras classes verifiquem se a integracao esta ativa.
  isEnabled(): boolean {
    return this.isConfigured;
  }

  private async deleteAssetByUrl(
    url: string | null | undefined,
    folder: string,
  ): Promise<void> {
    this.ensureConfigured();
    const publicId = this.extractPublicId(url, folder);
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

  // Helper compartilhado para enviar o buffer como asset do tipo raw.
  private uploadRaw(
    buffer: Buffer,
    options: { publicId: string; format?: string },
  ) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      // Cria uma stream de upload porque a Cloudinary espera assets raw como streams.
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: options.publicId,
          format: options.format,
          overwrite: true,
        },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              error instanceof Error ? error : new Error(String(error)),
            );
          }

          if (!result) {
            return reject(new Error('Cloudinary upload returned no result.'));
          }

          resolve(result);
        },
      );

      Readable.from(buffer).pipe(upload);
    });
  }

  // Extrai o public id da Cloudinary a partir da URL para permitir exclusoes futuras.
  private extractPublicId(
    url: string | null | undefined,
    expectedFolder: string,
  ): string | null {
    if (!url) {
      return null;
    }

    const uploadSegment = '/upload/';
    const segmentIndex = url.indexOf(uploadSegment);
    if (segmentIndex === -1) {
      return null;
    }

    const afterUpload = url.slice(segmentIndex + uploadSegment.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutResource = withoutVersion.replace(/^raw\//, '');
    const withoutExtension = withoutResource.replace(/\.[^./]+$/, '');

    if (!withoutExtension.startsWith(expectedFolder)) {
      return null;
    }

    return withoutExtension;
  }

  // Helper para upload de imagens (profile pictures) com transformações automáticas.
  private uploadImage(
    buffer: Buffer,
    options: { publicId: string },
  ) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: options.publicId,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned no result.'));
          }
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary credentials are not configured.',
      );
    }
  }
}
