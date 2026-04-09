import {
  IsString,
  IsNotEmpty,
  Matches,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({
    description: 'Vehicle plate (3 uppercase letters and 3 numbers)',
    example: 'ABC123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle plate is required' })
  @Matches(/^[A-Z]{3}\d{3}$/i, {
    message: 'Vehicle plate must follow the Colombian format (e.g., ABC123)',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  vehiclePlate!: string;

  @ApiProperty({
    description: 'Name of the driver (resolved internally)',
    example: 'Carlos',
  })
  @IsString()
  @IsNotEmpty({ message: 'Driver name is required' })
  @Transform(({ value }) => value?.trim())
  driverName!: string;

  @ApiProperty({
    description: 'Address where the route begins',
    example: 'Bodega Central, Calle 100 #15-20',
  })
  @IsString()
  @IsNotEmpty({ message: 'Origin address is required' })
  @Transform(({ value }) => value?.trim())
  originAddress!: string;

  @ApiProperty({
    description: 'Destination zone or delivery area for the route',
    example: 'Zona Norte',
  })
  @IsString()
  @IsNotEmpty({ message: 'Destination zone is required' })
  @Transform(({ value }) => value?.trim())
  destinationZone!: string;

  @ApiProperty({
    description: 'Scheduled date for the route in Colombian format (DD/MM/YYYY)',
    example: '10/04/2026',
  })
  @IsString()
  @IsNotEmpty({ message: 'Scheduled date is required' })
  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(20\d\d)$/, {
    message: 'Scheduled date must be in format DD/MM/YYYY',
  })
  @Transform(({ value }) => value?.trim())
  scheduledDate!: string;
}
