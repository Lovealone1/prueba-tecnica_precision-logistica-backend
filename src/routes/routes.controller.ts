import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteStatusDto } from './dto';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new route',
    description:
      'Driver name is dynamically searched without needing IDs natively. The dates input are DD/MM/YYYY formatting handling timezone safe translations.',
  })
  @ApiResponse({ status: 201, description: 'Route successfully scheduled' })
  @ApiResponse({
    status: 400,
    description: 'Invalid format inputs or past dates',
  })
  @ApiResponse({
    status: 404,
    description: 'Driver name matched absolutely nobody',
  })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update the status of a route',
    description: 'Enforces strict state machine: PENDING -> IN_PROGRESS -> DELIVERED.',
  })
  @ApiParam({ name: 'id', description: 'Route UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition attempted' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteStatusDto,
  ) {
    return this.routesService.updateStatus(id, dto);
  }
}
