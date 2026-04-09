import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto } from './dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDriverDto) {
    const existing = await this.prisma.client.driver.findUnique({
      where: { cedula: dto.cedula },
    });

    if (existing) {
      throw new ConflictException(
        `A driver with cédula "${dto.cedula}" is already registered`,
      );
    }

    return this.prisma.client.driver.create({ data: dto });
  }

  async findAll() {
    return this.prisma.client.driver.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const driver = await this.prisma.client.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }

    return driver;
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);

    if (dto.cedula) {
      const existing = await this.prisma.client.driver.findUnique({
        where: { cedula: dto.cedula },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A driver with cédula "${dto.cedula}" is already registered`,
        );
      }
    }

    return this.prisma.client.driver.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.client.driver.delete({
        where: { id },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar de la base de datos a un conductor que tiene rutas vinculadas.',
        );
      }
      throw error;
    }
  }
}
