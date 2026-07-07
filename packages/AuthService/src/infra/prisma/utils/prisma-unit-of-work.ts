import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Results,
  UnitOfWork,
} from './../../../auth/application/ports/unit-of-work';
import { Atomic } from './../../../auth/application/ports/Atomic';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  runBatch<T extends readonly Atomic<unknown>[]>(
    operations: T,
  ): Promise<Results<T>> {
    return this.prisma.$transaction([...operations]) as Promise<any>;
  }
}
