import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto';
import { todayColombia } from '../common/date/date.util';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Schedules a new route assignment for a vehicle.
   *
   * @remarks
   * Applies the following business rules:
   * - Resolves the driver by an exact, case-insensitive name match to infer the UUID.
   * - Parses dates safely into Colombian timezones (UTC-5) to prevent offset leakage.
   * - Restricts date scheduling to present or future dates only.
   * - Prevents double-booking a single vehicle plate on exactly the same day.
   *
   * @param dto - Data Transfer Object containing vehicle plate, driver name, origin, destination, and DD/MM/YYYY date.
   * @returns The newly persisted Prisma route entity.
   * @throws {NotFoundException} If the provided driver name matches no records.
   * @throws {BadRequestException} If the requested date resolves to the past globally in Colombia.
   * @throws {ConflictException} If the vehicle plate is already scheduled for that exact day.
   */
  async create(dto: CreateRouteDto) {
    const driver = await this.prisma.client.driver.findFirst({
      where: {
        name: {
          equals: dto.driverName,
          mode: 'insensitive',
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(
        `Driver containing name '${dto.driverName}' not found. Please verify or register the driver.`,
      );
    }

    const [day, month, year] = dto.scheduledDate.split('/');
    const dateFormatted = `${year}-${month}-${day}`;

    // Regla de Negocio: No se permite programar rutas en el pasado (UTC-5)
    const today = todayColombia();
    if (dateFormatted < today) {
      throw new BadRequestException(
        `Scheduled date (${dto.scheduledDate}) cannot be in the past. Today is ${today.split('-').reverse().join('/')}.`,
      );
    }

    // Horario general, medio dia para evitar errores con la zona horaria
    const targetDate = new Date(`${dateFormatted}T12:00:00.000Z`);

    // Regla de Negocio: Evitar doble asignación del mismo vehículo en el mismo día exacto
    const conflictingRoute = await this.prisma.client.route.findFirst({
      where: {
        vehiclePlate: dto.vehiclePlate,
        scheduledDate: targetDate,
      },
    });

    if (conflictingRoute) {
      throw new ConflictException(
        `El vehículo con placa ${dto.vehiclePlate} ya tiene una ruta programada para el día ${dto.scheduledDate}. No se permite doble asignación.`,
      );
    }

    return this.prisma.client.route.create({
      data: {
        vehiclePlate: dto.vehiclePlate,
        originAddress: dto.originAddress,
        destinationZone: dto.destinationZone,
        scheduledDate: targetDate,
        driverId: driver.id,
      },
    });
  }
}
