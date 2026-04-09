import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto } from './dto';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new driver' })
  @ApiResponse({ status: 201, description: 'Driver successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 409,
    description: 'Driver with this cédula already exists',
  })
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered drivers' })
  @ApiResponse({ status: 200, description: 'List of all drivers' })
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a driver by ID' })
  @ApiParam({ name: 'id', description: 'Driver UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Driver found' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver information' })
  @ApiParam({ name: 'id', description: 'Driver UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Driver successfully updated' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({
    status: 409,
    description: 'Cédula conflict with another driver',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a driver' })
  @ApiParam({ name: 'id', description: 'Driver UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Driver successfully removed' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.driversService.remove(id);
  }
}
