// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('doctors/pending')
  getPendingDoctors() {
    return this.adminService.getPendingDoctors();
  }

  @Patch('doctors/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.approveDoctor(id);
  }

  @Patch('doctors/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.rejectDoctor(id);
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deactivateUser(id);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { 
      email?: string; 
      phone?: string; 
      name?: string; 
      crm?: string; 
      specialty?: string;
      bio?: string;
      cpf?: string;
      dateOfBirth?: string;
      sex?: 'MALE' | 'FEMALE' | 'OTHER';
    }
  ) {
    return this.adminService.updateUser(id, body);
  }
}
