import { Module } from '@nestjs/common';
import { IpLookupImpl } from './info/IpLookupImpl';
import { RedisModule } from './redis/redis.module';
import { OAuthModule } from './oauth/oauth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IpLookup } from '../auth/application/ports/utils/IpLookup';

@Module({
  imports: [PrismaModule, RedisModule, OAuthModule],
  providers: [
    {
      provide: IpLookup,
      useClass: IpLookupImpl,
    },
  ],
  exports: [IpLookup],
})
export class InfraModule {}
