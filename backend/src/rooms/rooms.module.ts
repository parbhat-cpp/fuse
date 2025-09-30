import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';

@Module({
  providers: [RoomsGateway, RedisService, RoomsService],
})
export class RoomsModule {}
