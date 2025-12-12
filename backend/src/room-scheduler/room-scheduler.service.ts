import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { RoomScheduler } from './entities/room-scheduler.entity';
import { Room } from 'src/rooms/dto/room.dto';
import { RedisService } from 'src/redis/redis.service';
import { RoomType } from 'src/rooms/types';
import { Logger } from '@nestjs/common';
import { formatRoomData } from 'src/rooms/util';

@Injectable()
export class RoomSchedulerService {
  logger = new Logger(RoomSchedulerService.name);

  constructor(
    @InjectRepository(RoomScheduler)
    private roomSchedulerRepository: Repository<RoomScheduler>,
    @Inject('ROOM_SCHEDULER_QUEUE')
    private readonly queue: Queue,
    private readonly redisService: RedisService,
  ) {}

  async scheduleRoom(roomId: string, roomData: Room) {
    const delay = roomData.startAt.getTime() - Date.now();

    const scheduledRoom = this.roomSchedulerRepository.create({
      admin: roomData.admin,
      roomId,
      isPublic: roomData.isPublic,
      roomName: roomData.roomName,
      start_at: roomData.startAt.toISOString(),
      status: 'scheduled',
    });
    await this.roomSchedulerRepository.save(scheduledRoom);

    await this.queue.add(
      'room:activate',
      { roomId, startAt: roomData.startAt.toISOString() },
      {
        delay,
        removeOnComplete: true,
      },
    );
  }

  async isRoomActive(roomId: string) {
    const job = await this.queue.getDelayed();
    const jobData = job.find((j) => j.data.roomId === roomId);
    const delay =
      new Date(jobData.data.startAt as string).getTime() - Date.now();

    if (delay > 0) {
      return { isActive: false, delay };
    }

    if (!jobData) {
      return { isActive: false, delay: 0 };
    }

    return { isActive: true, delay };
  }

  async activateRoom(roomId: string) {
    const scheduledRoom = await this.roomSchedulerRepository.findOne({
      where: { roomId },
      relations: {
        admin: true,
      },
    });
    if (!scheduledRoom) return;

    scheduledRoom.status = 'active';
    await this.roomSchedulerRepository.save(scheduledRoom);

    const roomData: Room = {
      admin: scheduledRoom.admin,
      currentActivityData: {},
      currentActivityId: '',
      attendees: [],
      attendeesCount: 1,
      attendeesId: [scheduledRoom.admin.id],
      isPublic: scheduledRoom.isPublic,
      roomName: scheduledRoom.roomName,
      createdAt: scheduledRoom.created_at,
      roomId: scheduledRoom.roomId,
      startAt: new Date(scheduledRoom.start_at),
    };

    if (!roomData.isPublic)
      await this.redisService.redis.hset(
        `${RoomType.PRIVATE}:${roomId}`,
        formatRoomData(roomData),
      );

    await this.redisService.redis.hset(
      `${RoomType.PUBLIC}:${roomId}`,
      formatRoomData(roomData),
    );

    const delay = 2 * 60 * 1000; // room will be active for 2 minutes

    await this.queue.add(
      'room:terminate',
      { roomId },
      {
        delay,
        removeOnComplete: true,
      },
    );
  }

  async terminateRoom(roomId: string) {
    const room = await this.roomSchedulerRepository.findOne({
      where: { roomId },
      relations: {
        admin: true,
      },
    });
    if (!room) return;

    room.status = 'ended';
    await this.roomSchedulerRepository.save(room);

    await this.redisService.redis.del(`${RoomType.PRIVATE}:${roomId}`);

    await this.redisService.redis.del(`${RoomType.PUBLIC}:${roomId}`);
  }
}
