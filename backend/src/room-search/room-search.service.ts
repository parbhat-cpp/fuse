import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { RoomType } from 'src/rooms/types';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomScheduler } from 'src/room-scheduler/entities/room-scheduler.entity';
import { Repository } from 'typeorm';
import { UUID } from 'node:crypto';

@Injectable()
export class RoomSearchService {
  constructor(
    @InjectRepository(RoomScheduler)
    private roomSchedulerRepository: Repository<RoomScheduler>,
    private readonly redisService: RedisService,
  ) {}

  async searchRooms(
    query: string,
    nearBy: boolean,
    lat?: number,
    lng?: number,
    page: number = 0,
  ) {
    let matchPattern = `${RoomType.PUBLIC}:*`;

    if (query) matchPattern = `${RoomType.PUBLIC}:${query}*`;

    const [nextCursor, keys] = await this.redisService.redis.scan(
      page,
      'MATCH',
      matchPattern,
      'COUNT',
      5,
    );

    const rooms = [];

    for (const key of keys) {
      const roomData = await this.redisService.redis.hgetall(key);
      if (roomData) {
        rooms.push({
          roomName: roomData.roomName,
          startAt: roomData.startAt,
          attendeesCount: roomData.attendeesCount,
          roomId: roomData.roomId,
        });
      }
    }

    return {
      nextCursor,
      rooms,
    };
  }

  async searchScheduledRooms(userId: UUID, page: number = 0) {
    const scheduledRooms = await this.roomSchedulerRepository.find({
      where: {
        user_id: userId,
      },
      order: {
        start_at: 'ASC',
      },
      take: 10,
      skip: page * 10,
    });

    return {
      nextCursor: page + 1,
      rooms: scheduledRooms,
    };
  }
}
