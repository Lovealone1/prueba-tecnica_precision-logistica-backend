import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RouteStatus } from '@prisma/client';

export class UpdateRouteStatusDto {
  @ApiProperty({
    description: 'New status for the route',
    enum: RouteStatus,
    example: RouteStatus.IN_PROGRESS,
  })
  @IsEnum(RouteStatus, {
    message: 'Status must be one of: PENDING, IN_PROGRESS, DELIVERED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: RouteStatus;
}
