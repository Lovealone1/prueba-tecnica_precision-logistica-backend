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
    description: 'Driver UUID assigned to this route',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'Driver ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Driver ID is required' })
  driverId!: string;

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
    description: 'Scheduled date for the route in YYYY-MM-DD or standard ISO format',
    example: '2026-04-10',
  })
  @IsDateString({}, { message: 'Scheduled date must be a valid ISO date string (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate!: string;
}
