import { Module } from '@nestjs/common';
import { RoomSchedulerService } from './room-scheduler.service';
import { Queue } from 'bullmq';
import { RedisService } from 'src/redis/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomScheduler } from './entities/room-scheduler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomScheduler])],
  providers: [
    RoomSchedulerService,
    RedisService,
    {
      provide: 'ROOM_SCHEDULER_QUEUE',
      inject: [RedisService],
      useFactory: (redisService: RedisService) => {
        return new Queue('roomSchedulerQueue', {
          connection: redisService.redis,
        });
      },
    },
  ],
  exports: ['ROOM_SCHEDULER_QUEUE', RoomSchedulerService],
})
export class RoomSchedulerModule {}
