// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DoctorStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingDoctors() {
    return this.prisma.doctorProfile.findMany({
      where: { status: DoctorStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            isActive: true,
          },
        },
        address: true,
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  async approveDoctor(doctorProfileId: number) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de médico não encontrado.');
    }

    return this.prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: { status: DoctorStatus.APPROVED },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
  }

  async rejectDoctor(doctorProfileId: number) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de médico não encontrado.');
    }

    return this.prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: { status: DoctorStatus.REJECTED },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
  }

  async deactivateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async activateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        name: true,
        isActive: true,
        createdAt: true,
        doctorProfile: {
          select: {
            id: true,
            name: true,
            crm: true,
            specialty: true,
            bio: true,
            phone: true,
            status: true,
            address: true,
          },
        },
        patientProfile: {
          select: {
            id: true,
            name: true,
            cpf: true,
            dateOfBirth: true,
            sex: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(userId: number, data: { 
    email?: string; 
    phone?: string; 
    name?: string; 
    crm?: string; 
    specialty?: string;
    bio?: string;
    cpf?: string;
    dateOfBirth?: string;
    sex?: 'MALE' | 'FEMALE' | 'OTHER';
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctorProfile: true, patientProfile: true }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Update User model fields
    const userUpdateData: any = {};
    if (data.email) userUpdateData.email = data.email;
    if (data.phone !== undefined) userUpdateData.phone = data.phone;
    if (data.name) userUpdateData.name = data.name;

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    // Update profiles based on role
    // Phone is synced: same value goes to User.phone AND profile.phone
    if (user.role === 'DOCTOR' && user.doctorProfile) {
      const docUpdateData: any = {};
      if (data.name) docUpdateData.name = data.name;
      if (data.crm) docUpdateData.crm = data.crm;
      if (data.specialty !== undefined) docUpdateData.specialty = data.specialty;
      if (data.bio !== undefined) docUpdateData.bio = data.bio;
      if (data.phone !== undefined) docUpdateData.phone = data.phone;

      await this.prisma.doctorProfile.update({
        where: { id: user.doctorProfile.id },
        data: docUpdateData,
      });

      // Handle Doctor Address
      const hasAddressData = data.street !== undefined || data.number !== undefined || data.neighborhood !== undefined || data.city !== undefined || data.state !== undefined || data.zipCode !== undefined;
      if (hasAddressData) {
        const addressData = {
          street: data.street || '',
          number: data.number || '',
          complement: data.complement || null,
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
        };

        if (user.doctorProfile.addressId) {
          await this.prisma.address.update({
            where: { id: user.doctorProfile.addressId },
            data: addressData,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: addressData,
          });
          await this.prisma.doctorProfile.update({
            where: { id: user.doctorProfile.id },
            data: { addressId: newAddress.id },
          });
        }
      }
    } else if (user.role === 'PATIENT' && user.patientProfile) {
      const patientUpdateData: any = {};
      if (data.name) patientUpdateData.name = data.name;
      if (data.cpf) patientUpdateData.cpf = data.cpf;
      if (data.dateOfBirth) patientUpdateData.dateOfBirth = new Date(data.dateOfBirth);
      if (data.sex !== undefined) patientUpdateData.sex = data.sex;
      if (data.phone !== undefined) patientUpdateData.phone = data.phone;

      await this.prisma.patientProfile.update({
        where: { id: user.patientProfile.id },
        data: patientUpdateData,
      });

      // Handle Patient Address
      const hasAddressData = data.street !== undefined || data.number !== undefined || data.neighborhood !== undefined || data.city !== undefined || data.state !== undefined || data.zipCode !== undefined;
      if (hasAddressData) {
        const addressData = {
          street: data.street || '',
          number: data.number || '',
          complement: data.complement || null,
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
        };

        if (user.patientProfile.addressId) {
          await this.prisma.address.update({
            where: { id: user.patientProfile.addressId },
            data: addressData,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: addressData,
          });
          await this.prisma.patientProfile.update({
            where: { id: user.patientProfile.id },
            data: { addressId: newAddress.id },
          });
        }
      }
    }

    // Return the updated user to match the getAllUsers select block
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        name: true,
        isActive: true,
        createdAt: true,
        doctorProfile: {
          select: {
            id: true,
            name: true,
            crm: true,
            specialty: true,
            bio: true,
            phone: true,
            status: true,
            address: true,
          },
        },
        patientProfile: {
          select: {
            id: true,
            name: true,
            cpf: true,
            dateOfBirth: true,
            sex: true,
            phone: true,
            address: true,
          },
        },
      },
    });
  }
}
