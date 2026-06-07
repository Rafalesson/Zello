// Endereço: apps/backend/src/auth/auth.service.ts (versão com resetPassword)

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { ResetPasswordDto } from './dto/reset-password.dto'; // Importamos o novo DTO

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.userService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Sua conta foi desativada. Entre em contato com o suporte.');
    }
    const profile = user.doctorProfile || user.patientProfile;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: profile?.name,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return;
    }
    const asyncRandomBytes = promisify(randomBytes);
    const token = (await asyncRandomBytes(32)).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });
    try {
      await this.mailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error('Falha ao enviar email de recuperação (não bloqueante):', error);
      // NFR18: Falha no envio de email NÃO bloqueia o fluxo principal
    }
  }

  // ==========================================================
  // NOVA FUNÇÃO PARA REDEFINIÇÃO DE SENHA
  // ==========================================================
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password, passwordConfirmation } = resetPasswordDto;

    // 1. Validação inicial: as senhas coincidem?
    if (password !== passwordConfirmation) {
      throw new BadRequestException('As senhas não coincidem.');
    }

    // 2. Busca o usuário pelo token e verifica se o token não expirou.
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gte: new Date(), // 'gte' significa 'maior ou igual a', ou seja, a data de expiração ainda não passou.
        },
      },
    });

    // 3. Se não encontrou usuário ou o token expirou, retorna um erro genérico.
    if (!user) {
      throw new BadRequestException(
        'Token de recuperação inválido ou expirado.',
      );
    }

    // 4. Criptografa a nova senha.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Atualiza a senha e, muito importante, LIMPA os campos do token
    //    para que ele não possa ser usado novamente.
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }
}
