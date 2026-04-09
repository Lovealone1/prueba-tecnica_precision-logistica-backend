/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { nowColombia } from '../common/date/date.util';

function buildClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is missing');

  const adapter = new PrismaPg({ connectionString });
  const base = new PrismaClient({ adapter });

  return base.$extends({
    query: {
      $allModels: {
        create({ args, query }) {
          const now = nowColombia();
          args.data = {
            ...args.data,
            createdAt: (args.data as any).createdAt ?? now,
            updatedAt: (args.data as any).updatedAt ?? now,
          };
          return query(args);
        },

        update({ args, query }) {
          args.data = {
            ...args.data,
            updatedAt: (args.data as any).updatedAt ?? nowColombia(),
          };
          return query(args);
        },

        createMany({ args, query }) {
          const now = nowColombia();
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item: any) => ({
              ...item,
              createdAt: item.createdAt ?? now,
              updatedAt: item.updatedAt ?? now,
            })) as any;
          } else {
            args.data = {
              ...args.data,
              createdAt: (args.data as any).createdAt ?? now,
              updatedAt: (args.data as any).updatedAt ?? now,
            } as any;
          }
          return query(args);
        },

        updateMany({ args, query }) {
          args.data = {
            ...args.data,
            updatedAt: (args.data as any).updatedAt ?? nowColombia(),
          };
          return query(args);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof buildClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: ExtendedPrismaClient;

  constructor() {
    this._client = buildClient();
  }

  get client(): ExtendedPrismaClient {
    return this._client;
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }
}
