import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'General service health check' })
  @ApiResponse({ status: 200, description: 'Service is up and running' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connection health check' })
  @ApiResponse({ status: 200, description: 'PostgreSQL connection status' })
  @ApiResponse({ status: 503, description: 'Database unavailable' })
  async checkDatabase() {
    const dbHealth = await this.healthService.checkDatabase();

    const response = {
      database: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
      timestamp: new Date().toISOString(),
    };

    return response;
  }
}
