// Endereço: apps/backend/src/user/user.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { calculateNextAvailableSlot, formatNextAvailableSlot } from 'src/utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      role,
      name,
      phone,
      crm,
      specialty,
      bio,
      profilePictureUrl,
      cpf,
      dateOfBirth,
      sex,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Um usuário com este e-mail já existe.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const addressData =
      street && number && neighborhood && city && state && zipCode
        ? {
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zipCode,
          }
        : undefined;

    // MODIFICAÇÃO: A lógica foi refatorada para construir o objeto 'data' de forma incremental,
    // garantindo a segurança de tipos.
    const data: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      role,
      phone,
    };

    if (role === Role.DOCTOR) {
      data.doctorProfile = {
        create: {
          name,
          crm: crm || '',
          specialty,
          bio,
          profilePictureUrl,
          phone,
          ...(addressData && { address: { create: addressData } }),
        },
      };
    } else if (role === Role.PATIENT) {
      if (!cpf || !dateOfBirth) {
        throw new BadRequestException(
          'CPF e Data de Nascimento são obrigatórios para pacientes.',
        );
      }
      data.patientProfile = {
        create: {
          name,
          cpf,
          dateOfBirth: new Date(dateOfBirth),
          sex,
          phone,
          ...(addressData && { address: { create: addressData } }),
        },
      };
    }

    try {
      const user = await this.prisma.user.create({
        data, // Usamos o objeto 'data' que construímos
        include: {
          doctorProfile: { include: { address: true } },
          patientProfile: { include: { address: true } },
        },
      });

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      console.error('Erro inesperado ao criar usuário:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const fields = (error.meta?.target as string[]) || [];
          throw new BadRequestException(
            `Os seguintes dados já estão em uso: ${fields.join(', ')}.`,
          );
        }
      }
      throw new BadRequestException(
        'Não foi possível criar o usuário devido a um erro interno. Verifique os dados fornecidos.',
      );
    }
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: { include: { address: true } },
        patientProfile: { include: { address: true } },
      },
    });
  }

  async findPublicDoctorProfile(id: number) {
    let profile = await this.prisma.doctorProfile.findFirst({
      where: {
        id: id,
        status: 'APPROVED',
        user: { isActive: true },
      },
      select: {
        id: true,
        name: true,
        crm: true,
        specialty: true,
        bio: true,
        profilePictureUrl: true,
        consultationPrice: true,
        address: {
          select: {
            city: true,
            state: true,
            street: true,
            number: true,
            neighborhood: true,
          },
        },
        availabilities: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            slotDurationMinutes: true,
            isActive: true,
          },
        },
      },
    });

    if (!profile) {
      profile = await this.prisma.doctorProfile.findFirst({
        where: {
          userId: id,
          status: 'APPROVED',
          user: { isActive: true },
        },
        select: {
          id: true,
          name: true,
          crm: true,
          specialty: true,
          bio: true,
          profilePictureUrl: true,
          consultationPrice: true,
          address: {
            select: {
              city: true,
              state: true,
              street: true,
              number: true,
              neighborhood: true,
            },
          },
          availabilities: {
            where: { isActive: true },
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              slotDurationMinutes: true,
              isActive: true,
            },
          },
        },
      });
    }

    return profile;
  }

  async searchDoctors(filters: { query?: string; specialty?: string; city?: string; state?: string }) {
    const { query, specialty, city, state } = filters;
    const whereClause: Prisma.DoctorProfileWhereInput = {
      status: 'APPROVED',
      user: { isActive: true },
    };

    if (specialty) {
      whereClause.specialty = {
        equals: specialty,
        mode: 'insensitive',
      };
    }

    if (city || state) {
      const addressFilter: Prisma.AddressWhereInput = {};
      if (city) {
        addressFilter.city = {
          equals: city,
          mode: 'insensitive',
        };
      }
      if (state) {
        addressFilter.state = {
          equals: state,
          mode: 'insensitive',
        };
      }
      whereClause.address = addressFilter;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { specialty: { contains: query, mode: 'insensitive' } },
      ];
    }

    const doctors = await this.prisma.doctorProfile.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        crm: true,
        specialty: true,
        bio: true,
        profilePictureUrl: true,
        address: {
          select: {
            city: true,
            state: true,
          },
        },
        availabilities: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            slotDurationMinutes: true,
            isActive: true,
          },
        },
      },
    });

    return doctors.map((doc) => {
      const nextDate = calculateNextAvailableSlot(doc.availabilities);
      return {
        id: doc.id,
        name: doc.name,
        crm: doc.crm,
        specialty: doc.specialty,
        bio: doc.bio,
        profilePictureUrl: doc.profilePictureUrl,
        address: doc.address,
        nextAvailable: formatNextAvailableSlot(nextDate),
        nextAvailableDate: nextDate ? nextDate.toISOString() : null,
      };
    });
  }

  async updateDoctorProfile(userId: number, data: { consultationPrice?: number }) {
    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        consultationPrice: data.consultationPrice,
      },
    });
  }
}
