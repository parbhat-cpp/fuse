import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { formatRoomData, unformatRoomData } from './util';
import { RoomEvents } from './events';
import { randomUUID } from 'node:crypto';
import { RoomType } from './types';
import { JoinRoomDto } from './dto/join-room.dto';
import { Room } from './dto/room.dto';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { ChatDto } from './dto/chat.dto';
import { UserType } from 'src/user/entities/user.entity';
import { roomActivities } from './config';
import { RoomSchedulerService } from 'src/room-scheduler/room-scheduler.service';
import { AccessService } from 'src/lib/access/access.service';
import { NotificationsService } from 'src/lib/notifications/notifications.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomSchedulerService: RoomSchedulerService,
    private readonly redisService: RedisService,
    private readonly accessService: AccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async roomExists(roomId: string, userId: string) {
    try {
      // Check both room types
      const publicRoomExists = await this.redisService.redis.hexists(
        `${RoomType.PUBLIC}:${roomId}`,
        'roomId',
      );

      const privateRoomExists = await this.redisService.redis.hexists(
        `${RoomType.PRIVATE}:${roomId}`,
        'roomId',
      );

      Logger.debug(
        `roomExists check - roomId: ${roomId}, userId: ${userId}, public: ${publicRoomExists}, private: ${privateRoomExists}`,
      );

      // Neither exists
      if (!publicRoomExists && !privateRoomExists) {
        Logger.warn(`Room ${roomId} not found in either public or private`);
        return {
          exists: false,
          isMember: false,
          roomData: undefined,
          roomType: undefined,
        };
      }

      // Try public first if it exists
      if (publicRoomExists) {
        try {
          const roomData = await this.redisService.redis.hgetall(
            `${RoomType.PUBLIC}:${roomId}`,
          );

          Logger.debug(
            `Public room data keys: ${roomData ? Object.keys(roomData) : 'empty'}`,
          );

          if (roomData && Object.keys(roomData).length > 0) {
            const roomDataJson: Room = unformatRoomData(roomData);
            const attendeesId = Array.isArray(roomDataJson.attendeesId)
              ? roomDataJson.attendeesId
              : [];
            const isMember = userId ? attendeesId.includes(userId) : false;

            Logger.debug(
              `Found public room ${roomId}, isMember: ${isMember}, attendeesId: ${attendeesId}`,
            );

            return {
              exists: true,
              isMember,
              roomData: roomDataJson,
              roomType: RoomType.PUBLIC,
            };
          }
        } catch (error) {
          Logger.error(
            `Error fetching public room ${roomId}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Fallback to private if public failed
      if (privateRoomExists) {
        try {
          const roomData = await this.redisService.redis.hgetall(
            `${RoomType.PRIVATE}:${roomId}`,
          );

          Logger.debug(
            `Private room data keys: ${roomData ? Object.keys(roomData) : 'empty'}`,
          );

          if (roomData && Object.keys(roomData).length > 0) {
            const roomDataJson: Room = unformatRoomData(roomData);
            const attendeesId = Array.isArray(roomDataJson.attendeesId)
              ? roomDataJson.attendeesId
              : [];
            const isMember = userId ? attendeesId.includes(userId) : false;

            Logger.debug(
              `Found private room ${roomId}, isMember: ${isMember}, attendeesId: ${attendeesId}`,
            );

            return {
              exists: true,
              isMember,
              roomData: roomDataJson,
              roomType: RoomType.PRIVATE,
            };
          }
        } catch (error) {
          Logger.error(
            `Error fetching private room ${roomId}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Both exist flags were true but data retrieval failed for both
      Logger.warn(`Room ${roomId} exists in hash but data is empty or invalid`);
      return {
        exists: false,
        isMember: false,
        roomData: undefined,
        roomType: undefined,
      };
    } catch (error) {
      Logger.error(
        `Unexpected error in roomExists for ${roomId}: ${error.message}`,
        error.stack,
      );
      return {
        exists: false,
        isMember: false,
        roomData: undefined,
        roomType: undefined,
      };
    }
  }

  async createRoom(client: Socket, payload: CreateRoomDto) {
    payload.roomId = payload?.roomId ?? randomUUID().substring(0, 5);
    const roomId = payload.roomId;

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      'roomId',
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      'roomId',
    );

    if (publicRoomExists || privateRoomExists) {
      client.emit(RoomEvents.ROOM_EXISTS);
      return;
    }

    payload.attendees = [];
    payload.attendeesId = [payload.admin.id];
    payload.attendeesCount = payload.attendees.length + 1;
    const scheduleRoom = payload.startAt;
    payload.startAt = payload?.startAt ?? new Date();

    const roomData = formatRoomData(payload);

    const resData = unformatRoomData(roomData);

    if (scheduleRoom) {
      const { data, error } = await this.accessService.hasAccess(
        payload.admin.id,
        'schedule_room',
      );

      if (error) {
        client.emit(RoomEvents.ACCESS_DENIED);
        return;
      }

      if (data.PlanExpired) {
        client.emit(RoomEvents.PLAN_EXPIRED);
        return;
      }

      if (!data.IsAllowed) {
        client.emit(RoomEvents.ACCESS_DENIED);
        return;
      }

      await this.roomSchedulerService.scheduleRoom(
        roomId,
        resData,
        data.Plan.FeaturesJson.room_duration,
      );
      client.emit(RoomEvents.ROOM_SCHEDULED, {
        roomName: resData.roomName,
        roomId: resData.roomId,
        startAt: resData.startAt,
      });

      await this.notificationsService.sendNotification(
        payload.admin.id,
        `Room scheduled: ${resData.roomName}`,
        'Your room has been scheduled successfully.',
        { id: roomId, name: resData.roomName, startAt: resData.startAt },
        ['in-app', 'email'],
        'ROOM_SCHEDULED',
      );

      return;
    }

    if (payload.isPublic) {
      await this.redisService.redis.hset(
        `${RoomType.PUBLIC}:${roomId}`,
        roomData,
      );
    } else {
      await this.redisService.redis.hset(
        `${RoomType.PRIVATE}:${roomId}`,
        roomData,
      );
    }
    client.emit(RoomEvents.ROOM_CREATED, {
      roomData: resData,
      roomActivities,
    });
  }

  async joinRoom(
    client: Socket,
    payload: JoinRoomDto,
    userIdToSocketId: Map<string, string>,
  ) {
    const roomId = payload.roomId;
    const user = payload.joinee;
    const userId = client.data.userId;
    const publiclyAccessibleRoom = payload.publiclyAccessibleRoom;

    if (!roomId) {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
      return;
    }

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      'roomId',
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      'roomId',
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      }

      if (privateRoomExists) {
        roomType = RoomType.PRIVATE;
      }

      const { isActive, delay } =
        await this.roomSchedulerService.isRoomActive(roomId);

      if (!isActive) {
        client.emit(RoomEvents.ROOM_SCHEDULED, { delay });
        return;
      }

      if (publiclyAccessibleRoom) {
        const { success, data, error } = await this.accessService.hasAccess(
          userId,
          'join_public_room',
        );

        if (error) {
          client.emit(RoomEvents.ACCESS_DENIED);
          return;
        }

        if (data.PlanExpired) {
          client.emit(RoomEvents.PLAN_EXPIRED);
          return;
        }

        if (!success || !data.IsAllowed) {
          client.emit(RoomEvents.ACCESS_DENIED);
          return;
        }
      }

      const roomData = await this.redisService.redis.hgetall(
        `${roomType}:${roomId}`,
      );

      const roomDataJson: Room = unformatRoomData(roomData);

      if (
        !roomDataJson.admin.premium_account &&
        roomDataJson.attendeesCount === 5
      ) {
        client.emit(RoomEvents.ROOM_LIMIT_REACHED);
        return;
      }

      if (!roomDataJson.attendees.some((u) => u.id.match(userId))) {
        roomDataJson.attendees.push(user);
        roomDataJson.attendeesId.push(userId);
        roomDataJson.attendeesCount = roomDataJson.attendeesId.length;
      }

      await this.redisService.redis.hset(
        `${roomType}:${roomId}`,
        formatRoomData(roomDataJson),
      );

      client.emit(RoomEvents.ENTER_ROOM, {
        roomData: roomDataJson,
        roomActivities,
      });

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

        client.to(receiverId).emit(RoomEvents.NEW_ATTENDEE, {
          roomData: roomDataJson,
          joinee: user,
        });
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  async exitRoom(
    client: Socket,
    roomId: string,
    userId: string,
    userIdToSocketId: Map<string, string>,
  ) {
    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      'roomId',
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      'roomId',
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(
        `${roomType}:${roomId}`,
      );

      const roomDataJson = unformatRoomData(roomData);

      const roomAdminSocketId = roomDataJson['attendeesId'][0];

      // When room admin exit room
      if (roomAdminSocketId === userId) {
        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);
          client.to(receiverId).emit(RoomEvents.LEAVE_ROOM);
        }
        await this.redisService.redis.del(`${roomType}:${roomId}`);
      } else {
        // Get user info
        const user = roomDataJson.attendees.filter(
          (attendee) => attendee.id === userId,
        );

        roomDataJson.attendees = roomDataJson.attendees.filter(
          (attendee) => attendee.id !== userId,
        );

        // Remove user from room and update
        roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
          (attendeeId) => attendeeId !== userId,
        );

        roomDataJson.attendeesCount = roomDataJson.attendeesId.length;

        await this.redisService.redis.hset(
          `${roomType}:${roomId}`,
          formatRoomData(roomDataJson),
        );

        client.emit(
          RoomEvents.ATTENDEE_LEFT,
          user[0]?.username ?? user[0]?.full_name,
        );

        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

          client.to(receiverId).emit(RoomEvents.ATTENDEE_LEFT, {
            roomData: roomDataJson,
            attendee: user[0],
          });
        }
      }
      this.activityCleanup(roomId);
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  async removeAttendee(
    client: Socket,
    payload: RemoveAttendeeDto,
    userIdToSocketId: Map<string, string>,
  ) {
    const roomId = payload.roomId;
    const attendeeUserId = payload.attendeeUserId;

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      'roomId',
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      'roomId',
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(
        `${roomType}:${roomId}`,
      );

      const roomDataJson = unformatRoomData(roomData);

      const roomAdminId = roomDataJson['attendeesId'][0];

      if (userIdToSocketId.get(roomAdminId) !== client.id) {
        return;
      }

      client
        .to(userIdToSocketId.get(attendeeUserId))
        .emit(RoomEvents.LEAVE_ROOM);

      const user = roomDataJson.attendees.filter(
        (attendee) => attendee.id === attendeeUserId,
      );

      roomDataJson.attendees = roomDataJson.attendees.filter(
        (attendee) => attendee.id !== attendeeUserId,
      );

      roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
        (attendee) => attendee !== attendeeUserId,
      );

      roomDataJson.attendeesCount = roomDataJson.attendeesId.length;

      await this.redisService.redis.hset(
        `${roomType}:${roomId}`,
        formatRoomData(roomDataJson),
      );

      client.emit(RoomEvents.ATTENDEE_KICKED, {
        roomData: roomDataJson,
        attendee: user[0],
      });

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

        client.to(receiverId).emit(RoomEvents.ATTENDEE_KICKED, {
          roomData: roomDataJson,
          attendee: user[0],
        });
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  async sendMessage(
    client: Socket,
    payload: ChatDto,
    userIdToSocketId: Map<string, string>,
  ) {
    const userId = payload.userId;
    const roomId = payload.roomId;

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      'roomId',
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      'roomId',
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(
        `${roomType}:${roomId}`,
      );

      const roomDataJson = unformatRoomData(roomData);

      let user: UserType;

      if (roomDataJson.admin.id === userId) {
        user = roomDataJson.admin;
      } else {
        for (const attendee of roomDataJson.attendees) {
          const sender = JSON.parse(attendee as unknown as string);
          if (sender.id === userId) user = sender;
        }
      }

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const attendeeId = roomDataJson.attendeesId[i];

        if (attendeeId === userId) continue;

        const receiverId = userIdToSocketId.get(attendeeId);

        client.to(receiverId).emit(RoomEvents.RECEIVE_MESSAGE, {
          sendBy: user,
          message: payload.message,
          sentAt: new Date().toISOString(),
        });
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  private async setActivity(
    client: Socket,
    roomId: string,
    activityId: string,
    userIdToSocketId: Map<string, string>,
  ) {
    const userId = client.data.userId;
    const username = client.data.userName;

    const { exists, isMember, roomData } = await this.roomExists(
      roomId,
      userId,
    );

    if (!exists) {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
      return;
    }

    if (!isMember) {
      client.emit(RoomEvents.NOT_MEMBER);
      return;
    }

    await this.redisService.redis.set(
      `${roomId}:activity:${activityId}`,
      JSON.stringify({ activityId, startAt: new Date().toISOString() }),
    );

    for (let i = 0; i < roomData.attendeesId.length; i++) {
      const attendeeId = roomData.attendeesId[i];
      client
        .to(userIdToSocketId.get(attendeeId))
        .emit(RoomEvents.LOAD_ACTIVITY, {
          username,
          activityId,
          activityData: {
            id: activityId,
            name: roomActivities.find((a) => a.id === activityId)?.name,
          },
        });
    }
  }

  async updateActivity(
    client: Socket,
    roomId: string,
    activityId: string,
    activityData: Record<string, any>,
    userIdToSocketId: Map<string, string>,
  ) {
    const userId = client.data.userId;
    const username = client.data.userName;

    if (!roomId || !activityId) {
      Logger.warn(
        `Invalid updateActivity call: roomId=${roomId}, activityId=${activityId}`,
      );
      client.emit(RoomEvents.ROOM_NOT_FOUND);
      return;
    }

    const { exists, isMember, roomData } = await this.roomExists(
      roomId,
      userId,
    );

    Logger.log({ exists, isMember, roomData });

    if (!exists) {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
      return;
    }

    if (!isMember) {
      client.emit(RoomEvents.NOT_MEMBER);
      return;
    }

    await this.redisService.redis.set(
      `${roomId}:activity:${activityId}`,
      JSON.stringify({ id: activityId, ...activityData }),
    );

    for (let i = 0; i < roomData.attendeesId.length; i++) {
      const attendeeId = roomData.attendeesId[i];
      client
        .to(userIdToSocketId.get(attendeeId))
        .emit(RoomEvents.LOAD_ACTIVITY, {
          username,
          id: activityId,
          activityData,
        });
    }
  }

  async syncActivity(
    client: Socket,
    roomId: string,
    activityId: string,
    userIdToSocketId: Map<string, string>,
  ) {
    const activityData = await this.redisService.redis.get(
      `${roomId}:activity:${activityId}`,
    );

    if (!activityData) {
      this.setActivity(client, roomId, activityId, userIdToSocketId);
    } else {
      client.emit(RoomEvents.LOAD_ACTIVITY, {
        username: client.data.userName,
        id: activityId,
        activityData: JSON.parse(activityData),
      });
    }
  }

  private async activityCleanup(roomId: string) {
    let cursor = '0';
    do {
      const [newCursor, keys] = await this.redisService.redis.scan(
        cursor,
        'MATCH',
        `${roomId}:activity:*`,
      );
      cursor = newCursor;

      if (keys.length > 0) {
        await this.redisService.redis.del(keys);
      }
    } while (cursor !== '0');
  }

  /**
   * sync activity -> if no activity -> set activity -> broadcast activity
   */
}
