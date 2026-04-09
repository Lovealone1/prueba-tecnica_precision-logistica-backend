import { Test, TestingModule } from '@nestjs/testing';
import { RoutesService } from './routes.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { RouteStatus } from '@prisma/client';

describe('RoutesService (State Machine)', () => {
  let service: RoutesService;
  let prismaService: {
    client: {
      route: {
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };
  };

  // Mock espía simplificado aislado de integraciones Postgres
  const mockPrismaClient = {
    client: {
      route: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: PrismaService,
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as unknown as typeof prismaService;
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('debería permitir la transición inicial obligatoria: PENDING -> IN_PROGRESS', async () => {
      const mockRoute = { id: '#ruta1', status: RouteStatus.PENDING };

      prismaService.client.route.findUnique.mockResolvedValue(mockRoute);
      prismaService.client.route.update.mockResolvedValue({
        ...mockRoute,
        status: RouteStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus('#ruta1', {
        status: RouteStatus.IN_PROGRESS,
      });
      expect(result.status).toBe(RouteStatus.IN_PROGRESS);
      expect(prismaService.client.route.update).toHaveBeenCalled();
    });

    it('debería generar una EXCEPCIÓN si se intenta finalizar (DELIVERED) una ruta que nunca ha sido iniciada (PENDING)', async () => {
      // Estado Inicial en Base de Datos: Pendiente
      const mockRoute = { id: '#ruta1', status: RouteStatus.PENDING };
      prismaService.client.route.findUnique.mockResolvedValue(mockRoute);

      // Verificamos estricta y rígidamente: Error Arrojado HTTP 400 + Mensaje de texto explícito
      await expect(
        service.updateStatus('#ruta1', { status: RouteStatus.DELIVERED }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateStatus('#ruta1', { status: RouteStatus.DELIVERED }),
      ).rejects.toThrow('Cannot complete a route that has never been started.');

      // Validamos férreamente que Prisma NUNCA debió ejecutar la inyección al DB!
      expect(prismaService.client.route.update).not.toHaveBeenCalled();
    });

    it('debería permitir PENDING devuelta si estaba IN_PROGRESS (por si el camión se daña)', async () => {
      const mockRoute = { id: '#ruta2', status: RouteStatus.IN_PROGRESS };

      prismaService.client.route.findUnique.mockResolvedValue(mockRoute);
      prismaService.client.route.update.mockResolvedValue({
        ...mockRoute,
        status: RouteStatus.PENDING,
      });

      const result = await service.updateStatus('#ruta2', {
        status: RouteStatus.PENDING,
      });
      expect(result.status).toBe(RouteStatus.PENDING);
    });
  });
});
