import { Module } from '@nestjs/common';
import { RoomSearchService } from './room-search.service';
import { RoomSearchController } from './room-search.controller';
import { RedisService } from 'src/redis/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomScheduler } from 'src/room-scheduler/entities/room-scheduler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomScheduler])],
  providers: [RoomSearchService, RedisService],
  controllers: [RoomSearchController],
})
export class RoomSearchModule {}
