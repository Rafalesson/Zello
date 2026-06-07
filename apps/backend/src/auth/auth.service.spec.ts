import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: any;
  let mockJwtService: any;
  let mockMailService: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserService = {
      findOneByEmail: jest.fn(),
    };
    mockJwtService = {
      signAsync: jest.fn(),
    };
    mockMailService = {
      sendPasswordResetEmail: jest.fn(),
    };
    mockPrisma = {
      user: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    authService = new AuthService(
      mockUserService,
      mockJwtService,
      mockMailService,
      mockPrisma,
    );
  });

  describe('signIn', () => {
    it('should return access_token when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'ana@test.com',
        password: '$2b$10$hashedpassword',
        role: 'PATIENT',
        isActive: true,
        patientProfile: { name: 'Ana' },
        doctorProfile: null,
      };

      // bcrypt.compare will be called, so we mock the user's password to match
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      mockUserService.findOneByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('mocked-jwt-token');

      const result = await authService.signIn('ana@test.com', 'password123');

      expect(result).toEqual({ access_token: 'mocked-jwt-token' });
      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith('ana@test.com');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'ana@test.com',
        role: 'PATIENT',
        name: 'Ana',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserService.findOneByEmail.mockResolvedValue(null);

      await expect(
        authService.signIn('unknown@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const mockUser = {
        id: 1,
        email: 'ana@test.com',
        password: '$2b$10$hashedpassword',
        role: 'PATIENT',
        isActive: true,
        patientProfile: { name: 'Ana' },
        doctorProfile: null,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      mockUserService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.signIn('ana@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should include role in JWT payload for Socket.IO compatibility', async () => {
      const mockUser = {
        id: 42,
        email: 'carlos@test.com',
        password: '$2b$10$hashedpassword',
        role: 'DOCTOR',
        isActive: true,
        doctorProfile: { name: 'Dr. Carlos' },
        patientProfile: null,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      mockUserService.findOneByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('doctor-token');

      await authService.signIn('carlos@test.com', 'password123');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 42,
          role: 'DOCTOR',
        }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('should silently return when user is not found (no leak)', async () => {
      mockUserService.findOneByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword('nonexistent@test.com'),
      ).resolves.toBeUndefined();

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should generate token and send email when user exists', async () => {
      const mockUser = { id: 1, email: 'ana@test.com' };
      mockUserService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await authService.forgotPassword('ana@test.com');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetExpires: expect.any(Date),
          }),
        }),
      );
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'ana@test.com',
        expect.any(String),
      );
    });

    it('should resolve without error when mail service throws (NFR18)', async () => {
      const mockUser = { id: 1, email: 'ana@test.com' };
      mockUserService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      // forgotPassword must NOT throw even if email fails
      await expect(
        authService.forgotPassword('ana@test.com'),
      ).resolves.toBeUndefined();
    });

    it('should save token and expiry to DB even if email fails', async () => {
      const mockUser = { id: 1, email: 'ana@test.com' };
      mockUserService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('SMTP timeout'),
      );

      await authService.forgotPassword('ana@test.com');

      // DB update must have been called BEFORE mail was attempted
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetExpires: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException when passwords do not match', async () => {
      const { BadRequestException } = require('@nestjs/common');

      await expect(
        authService.resetPassword({
          token: 'valid-token',
          password: 'newpassword123',
          passwordConfirmation: 'differentpassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token is expired or invalid', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'expired-token',
          password: 'newpassword123',
          passwordConfirmation: 'newpassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash new password and clear reset token on success', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhashedpassword');

      mockPrisma.user.findFirst.mockResolvedValue({ id: 5 });
      mockPrisma.user.update.mockResolvedValue({});

      await authService.resetPassword({
        token: 'valid-token',
        password: 'securepassword',
        passwordConfirmation: 'securepassword',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          password: '$2b$10$newhashedpassword',
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });
  });

  describe('signIn - inactive user', () => {
    it('should throw UnauthorizedException when user is inactive', async () => {
      const mockUser = {
        id: 1,
        email: 'ana@test.com',
        password: '$2b$10$hashedpassword',
        role: 'PATIENT',
        isActive: false,
        patientProfile: { name: 'Ana' },
        doctorProfile: null,
      };

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockUserService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.signIn('ana@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
