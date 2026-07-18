import { IsBoolean, Equals, IsString, IsNotEmpty } from 'class-validator';

export class CreateConsentDto {
  @IsBoolean({ message: 'O campo de aceitação é obrigatório.' })
  @Equals(true, { message: 'Você deve aceitar os termos para prosseguir.' })
  accepted: boolean;

  @IsString({ message: 'A versão do termo deve ser uma string.' })
  @IsNotEmpty({ message: 'A versão do termo é obrigatória.' })
  termsVersion: string;
}
