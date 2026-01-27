import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { YtService } from './yt/yt.service';
import { RoomSchedulerModule } from 'src/room-scheduler/room-scheduler.module';
import { AccessService } from 'src/lib/access/access.service';

@Module({
  imports: [RoomSchedulerModule],
  providers: [
    RoomsGateway,
    RedisService,
    RoomsService,
    YtService,
    AccessService,
  ],
})
export class RoomsModule {}
