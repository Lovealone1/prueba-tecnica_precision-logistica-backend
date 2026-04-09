import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new route',
    description: 'Driver name is dynamically searched without needing IDs natively. The dates input are DD/MM/YYYY formatting handling timezone safe translations.',
  })
  @ApiResponse({ status: 201, description: 'Route successfully scheduled' })
  @ApiResponse({ status: 400, description: 'Invalid format inputs or past dates' })
  @ApiResponse({ status: 404, description: 'Driver name matched absolutely nobody' })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }
}
