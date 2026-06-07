// src/user/user.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (NFR25)

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('upload-profile-picture')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('O arquivo excede o tamanho máximo de 5MB.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas.');
    }

    const identifier = `doctor-${Date.now()}`;
    const result = await this.cloudinaryService.uploadProfilePicture(
      file.buffer,
      identifier,
    );

    return { url: result.secure_url };
  }

  // Endpoint público — perfil do médico (FR10)
  @Get('doctors/:id/public')
  async getPublicDoctorProfile(@Param('id', ParseIntPipe) id: number) {
    const profile = await this.userService.findPublicDoctorProfile(id);
    if (!profile) {
      throw new NotFoundException('Perfil de médico não encontrado.');
    }
    return profile;
  }

  // Endpoint público — busca de médicos (FR9)
  @Get('doctors')
  async getDoctors(
    @Query('q') query?: string,
    @Query('specialty') specialty?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
  ) {
    return this.userService.searchDoctors({ query, specialty, city, state });
  }

  // Endpoint para atualizar configurações do médico (como preço da consulta)
  @Patch('doctors/me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('DOCTOR')
  async updateMyDoctorProfile(@Request() req, @Body() body: { consultationPrice?: number }) {
    return this.userService.updateDoctorProfile(req.user.id, body);
  }
}
