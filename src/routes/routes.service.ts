import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, UpdateRouteStatusDto } from './dto';
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
    const conflictingVehicle = await this.prisma.client.route.findFirst({
      where: {
        vehiclePlate: dto.vehiclePlate,
        scheduledDate: targetDate,
      },
    });

    if (conflictingVehicle) {
      throw new ConflictException(
        `Vehicle with plate ${dto.vehiclePlate} is already scheduled for a route on ${dto.scheduledDate}.`,
      );
    }

    // Regla de Negocio: Evitar que un conductor tenga múltiples rutas asignadas el mismo día
    const conflictingDriver = await this.prisma.client.route.findFirst({
      where: {
        driverId: driver.id,
        scheduledDate: targetDate,
      },
    });

    if (conflictingDriver) {
      throw new ConflictException(
        `Driver ${dto.driverName} is already assigned to a route on ${dto.scheduledDate}.`,
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

  /**
   * Updates the status of a scheduled route applying strict state machine rules.
   *
   * @remarks
   * Allowed directional transitions:
   * - PENDING -> IN_PROGRESS
   * - IN_PROGRESS -> DELIVERED
   * - IN_PROGRESS -> PENDING (revert)
   *
   * @param id - Route UUID.
   * @param dto - New requested status enum.
   * @returns The updated route entity.
   * @throws {NotFoundException} If the route ID does not exist.
   * @throws {BadRequestException} If the transition skips a step or goes backwards.
   */
  async updateStatus(id: string, dto: UpdateRouteStatusDto) {
    const route = await this.prisma.client.route.findUnique({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException(`Ruta con ID '${id}' no encontrada.`);
    }

    // Idempotencia: si se intenta actualizar al mismo estado, se devuelve la ruta.
    if (route.status === dto.status) {
      return route;
    }

    // Validación de estado
    const isValidTransition =
      (route.status === 'PENDING' && dto.status === 'IN_PROGRESS') ||
      (route.status === 'IN_PROGRESS' && dto.status === 'DELIVERED') ||
      (route.status === 'IN_PROGRESS' && dto.status === 'PENDING');

    if (!isValidTransition) {
      // Manejo de errores específicos según la combinación anómala
      if (route.status === 'PENDING' && dto.status === 'DELIVERED') {
        throw new BadRequestException(
          'Cannot complete a route that has never been started.',
        );
      }
      if (route.status === 'DELIVERED') {
        throw new BadRequestException(
          'Cannot modify the status of a route that has already been delivered.',
        );
      }

      throw new BadRequestException(
        `Invalid status transition from ${route.status} to ${dto.status}.`,
      );
    }

    return this.prisma.client.route.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /**
   * Retrieves a unique, deduplicated list of vehicle plates that have at least one scheduled route.
   */
  async getPlatesWithRoutes() {
    const uniqueRoutes = await this.prisma.client.route.findMany({
      select: {
        vehiclePlate: true,
      },
      distinct: ['vehiclePlate'],
    });

    return uniqueRoutes.map((route) => route.vehiclePlate);
  }

  /**
   * Retrieves all route assignments aggressively optimized under the vehiclePlate Index.
   * Includes explicitly safe joined Driver data preventing data over-exposure.
   *
   * @param vehiclePlate Exact vehicle plate string
   */
  async findByVehiclePlate(vehiclePlate: string) {
    const routes = await this.prisma.client.route.findMany({
      where: {
        vehiclePlate: {
          equals: vehiclePlate,
          mode: 'insensitive',
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            cedula: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    if (!routes || routes.length === 0) {
      throw new NotFoundException(
        `No routes found scheduled for vehicle plate '${vehiclePlate}'.`,
      );
    }

    // Omitimos la llave foránea redundante 'driverId' porque ya incluimos el objeto relacional 'driver'
    return routes.map(({ driverId, ...routeData }) => routeData);
  }
}
