import { Test, TestingModule } from '@nestjs/testing';
import { DriversService } from './drivers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DriversService', () => {
  let service: DriversService;
  let prismaService: any; // We use any to quickly mock the highly dynamic client structure

  // Objeto Mock (Espía) de Prisma
  const mockPrismaClient = {
    client: {
      driver: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: PrismaService,
          useValue: mockPrismaClient, // inyectamos el mock directamente
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpiamos los espías entre cada prueba
    jest.clearAllMocks();
  });

  it('debería estar definido (instanciado)', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar un arreglo de conductores', async () => {
      // Configuramos el mock
      const mockedDrivers = [{ id: '1', name: 'Carlos', cedula: '123' }];
      prismaService.client.driver.findMany.mockResolvedValue(mockedDrivers);

      const result = await service.findAll();

      expect(result).toEqual(mockedDrivers);
      expect(prismaService.client.driver.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('debería crear y retornar exitosamente un conductor', async () => {
      const createDto = { name: 'Juan', cedula: '102030' };
      const expectedDriver = { id: 'uuid', ...createDto };

      // Simulamos que la cédula no existe previamente
      prismaService.client.driver.findUnique.mockResolvedValue(null);
      // Simulamos la creación exitosa
      prismaService.client.driver.create.mockResolvedValue(expectedDriver);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedDriver);
      expect(prismaService.client.driver.findUnique).toHaveBeenCalledWith({
        where: { cedula: createDto.cedula },
      });
      expect(prismaService.client.driver.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('debería lanzar ConflictException si la cédula ya existe', async () => {
      const createDto = { name: 'Pedro', cedula: '999999' };
      const existingDriver = { id: 'uuid-existente', ...createDto };

      // Simulamos que la base de datos EN 
      // CONTRÓ un driver con esta cédula
      prismaService.client.driver.findUnique.mockResolvedValue(existingDriver);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      
      // Aseguramos de que create NUNCA se haya llamado si falló la validación
      expect(prismaService.client.driver.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un solo conductor válido', async () => {
      const mockDriver = { id: 'uuid-1', name: 'Luis', cedula: '111222' };
      prismaService.client.driver.findUnique.mockResolvedValue(mockDriver);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockDriver);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      prismaService.client.driver.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
