import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { YtService } from './yt/yt.service';

@Module({
  providers: [RoomsGateway, RedisService, RoomsService, YtService],
})
export class RoomsModule {}
