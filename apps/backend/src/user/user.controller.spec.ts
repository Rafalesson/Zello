import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    searchDoctors: jest.fn(),
    findPublicDoctorProfile: jest.fn(),
  };

  const mockCloudinaryService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDoctors', () => {
    it('should call userService.searchDoctors with search parameters', async () => {
      mockUserService.searchDoctors.mockResolvedValue([]);

      const result = await controller.getDoctors('Helena', 'Cardiologista', 'São Paulo', 'SP');

      expect(userService.searchDoctors).toHaveBeenCalledWith({
        query: 'Helena',
        specialty: 'Cardiologista',
        city: 'São Paulo',
        state: 'SP',
      });
      expect(result).toEqual([]);
    });
  });
});
