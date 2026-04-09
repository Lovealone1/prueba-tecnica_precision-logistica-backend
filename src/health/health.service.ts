import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();

    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'disconnected',
        latencyMs: Date.now() - start,
      };
    }
  }
}
