import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private transporterPromise: Promise<void> | null = null;

  constructor() {
    this.transporterPromise = this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      this.logger.error('Falha ao inicializar o transporter de e-mail:', error);
      this.transporter = null;
    }
  }

  async sendPasswordResetEmail(
    userEmail: string,
    token: string,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado! Nao foi possivel enviar o e-mail de redefinicao de senha.');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${token}`;

    const info = await this.transporter.sendMail({
      from: '"Equipe Zello" <nao-responda@zello.com.br>',
      to: userEmail,
      subject: 'Recuperacao de Senha - Zello',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Recuperacao de Senha</h2>
          <p>Ola,</p>
          <p>Voce solicitou a redefinicao de sua senha. Clique no link abaixo para criar uma nova senha:</p>
          <p style="margin: 20px 0;">
            <a
               href="${resetUrl}"
              style="background-color: #0d9488; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;"
            >
              Redefinir Minha Senha
            </a>
          </p>
          <p>Se voce nao solicitou isso, por favor, ignore este e-mail.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Zello.</p>
        </div>
      `,
    });

    this.logger.log(
      `E-mail de teste enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
    );
  }

  async sendBookingConfirmationToPatient(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    date: Date,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado! Nao foi possivel enviar confirmacao para o paciente.');
      return;
    }

    if (isNaN(date.getTime())) {
      this.logger.error('Data invalida para o envio do e-mail de confirmacao do paciente.');
      return;
    }

    try {
      const formattedDate = formatInTimeZone(date, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      const info = await this.transporter.sendMail({
        from: '"Equipe Zello" <nao-responda@zello.com.br>',
        to: patientEmail,
        subject: 'Confirmação de Agendamento - Zello',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0d9488;">Consulta Confirmada!</h2>
            <p>Olá, <strong>${patientName}</strong>,</p>
            <p>Sua consulta com <strong>Dr(a). ${doctorName}</strong> foi agendada com sucesso.</p>
            <p style="background-color: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
              📅 <strong>Data e Horário:</strong> ${formattedDate}
            </p>
            <p>Agradecemos por usar o Zello.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Zello.</p>
          </div>
        `,
      });

      this.logger.log(`E-mail de paciente enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail para o paciente:', error);
    }
  }

  async sendBookingConfirmationToDoctor(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    date: Date,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado! Nao foi possivel enviar confirmacao para o medico.');
      return;
    }

    if (isNaN(date.getTime())) {
      this.logger.error('Data invalida para o envio do e-mail de confirmacao do medico.');
      return;
    }

    try {
      const formattedDate = formatInTimeZone(date, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      const info = await this.transporter.sendMail({
        from: '"Equipe Zello" <nao-responda@zello.com.br>',
        to: doctorEmail,
        subject: 'Novo Agendamento - Zello',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0d9488;">Novo Agendamento</h2>
            <p>Olá, <strong>Dr(a). ${doctorName}</strong>,</p>
            <p>Você tem uma nova consulta agendada com o paciente <strong>${patientName}</strong>.</p>
            <p style="background-color: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
              📅 <strong>Data e Horário:</strong> ${formattedDate}
            </p>
            <p>Por favor, acesse o painel para mais detalhes.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Zello.</p>
          </div>
        `,
      });

      this.logger.log(`E-mail de medico enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail para o medico:', error);
    }
  }

  async sendCancellationToDoctor(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    date: Date,
    reason?: string,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado! Nao foi possivel enviar confirmacao para o medico.');
      return;
    }

    if (isNaN(date.getTime())) {
      this.logger.error('Data invalida para o envio do e-mail de cancelamento do medico.');
      return;
    }

    try {
      const formattedDate = formatInTimeZone(date, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      const info = await this.transporter.sendMail({
        from: '"Equipe Zello" <nao-responda@zello.com.br>',
        to: doctorEmail,
        subject: 'Consulta Cancelada - Zello',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ef4444;">Consulta Cancelada</h2>
            <p>Olá, <strong>Dr(a). ${doctorName}</strong>,</p>
            <p>A consulta com o paciente <strong>${patientName}</strong> foi cancelada pelo paciente.</p>
            <p style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
              📅 <strong>Data e Horário:</strong> ${formattedDate}
              ${reason ? `<br><br>💬 <strong>Motivo informado:</strong> ${reason}` : ''}
            </p>
            <p>Este horário agora está novamente disponível em sua agenda.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Zello.</p>
          </div>
        `,
      });

      this.logger.log(`E-mail de cancelamento medico enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de cancelamento para o medico:', error);
    }
  }

  async sendRescheduleEmailToPatient(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    oldDate: Date,
    newDate: Date,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado!');
      return;
    }

    try {
      const formattedOldDate = formatInTimeZone(oldDate, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const formattedNewDate = formatInTimeZone(newDate, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      const info = await this.transporter.sendMail({
        from: '"Equipe Zello" <nao-responda@zello.com.br>',
        to: patientEmail,
        subject: 'Consulta Reagendada - Zello',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Consulta Reagendada</h2>
            <p>Olá, <strong>${patientName}</strong>,</p>
            <p>Sua consulta com <strong>Dr(a). ${doctorName}</strong> foi reagendada com sucesso.</p>
            <p style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
              <del style="color: #9ca3af;">Data antiga: ${formattedOldDate}</del><br>
              📅 <strong>Nova Data e Horário:</strong> ${formattedNewDate}
            </p>
            <p>Agradecemos por usar o Zello.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Zello.</p>
          </div>
        `,
      });

      this.logger.log(`E-mail de reagendamento paciente enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de reagendamento para o paciente:', error);
    }
  }

  async sendRescheduleEmailToDoctor(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    oldDate: Date,
    newDate: Date,
  ): Promise<void> {
    if (!this.transporter && this.transporterPromise) {
      await this.transporterPromise;
    }

    if (!this.transporter) {
      this.logger.error('Transporter nao inicializado!');
      return;
    }

    try {
      const formattedOldDate = formatInTimeZone(oldDate, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const formattedNewDate = formatInTimeZone(newDate, 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

      const info = await this.transporter.sendMail({
        from: '"Equipe Zello" <nao-responda@zello.com.br>',
        to: doctorEmail,
        subject: 'Consulta Reagendada pelo Paciente - Zello',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Consulta Reagendada</h2>
            <p>Olá, <strong>Dr(a). ${doctorName}</strong>,</p>
            <p>A consulta com o paciente <strong>${patientName}</strong> foi reagendada pelo próprio paciente.</p>
            <p style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
              <del style="color: #9ca3af;">Data antiga: ${formattedOldDate}</del><br>
              📅 <strong>Nova Data e Horário:</strong> ${formattedNewDate}
            </p>
            <p>O horário antigo agora está novamente disponível em sua agenda.</p>
            <br>
            <p>Atenciosamente,<br>Equipe Zello.</p>
          </div>
        `,
      });

      this.logger.log(`E-mail de reagendamento medico enviado! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de reagendamento para o medico:', error);
    }
  }
}
