import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({
    description: 'Full name of the driver',
    example: 'Carlos Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Driver name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({
    description:
      'Unique identification number (cédula) of the driver. Only digits allowed, between 6 and 12 characters.',
    example: '1234567890',
    minLength: 6,
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty({ message: 'Cédula is required' })
  @Matches(/^\d{6,12}$/, {
    message: 'Cédula must contain only digits and be between 6 and 12 characters',
  })
  @Transform(({ value }) => value?.trim())
  cedula!: string;
}
