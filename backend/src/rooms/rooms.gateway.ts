import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { RoomEvents } from './events';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/ws-auth/ws-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { randomUUID } from 'node:crypto';
import { RoomType } from './types';
import { JoinRoomDto } from './dto/join-room.dto';
import { Room } from './dto/room.dto';
import { formatRoomData, unformatRoomData } from './util';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: "/room",
  cors: {
    origin: "*",
  },
})
export class RoomsGateway {
  constructor(
    private readonly redisService: RedisService,
    private readonly roomsService: RoomsService,
  ) { }

  @SubscribeMessage(RoomEvents.CREATE_ROOM)
  async createRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: CreateRoomDto) {
    payload.roomId = payload?.roomId ?? randomUUID().substring(0, 5);
    const roomId = payload.roomId;

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      "roomId",
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      "roomId",
    );

    if (publicRoomExists || privateRoomExists) {
      client.emit(RoomEvents.ROOM_EXISTS);
      return;
    }

    payload.attendees = [];
    payload.attendeesId = [client.id];
    payload.attendeesCount = payload.attendees.length + 1;
    payload.startAt = payload?.startAt ?? new Date();

    const roomData = formatRoomData(payload);

    if (payload.isPublic) {
      await this.redisService.redis.hset(`${RoomType.PUBLIC}:${roomId}`, roomData);
    } else {
      await this.redisService.redis.hset(`${RoomType.PRIVATE}:${roomId}`, roomData);
    }
    client.emit(RoomEvents.ROOM_CREATED, roomData);
  }

  @SubscribeMessage(RoomEvents.JOIN_ROOM)
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomDto) {
    const roomId = payload.roomId;
    const user = payload.joinee;

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

      roomDataJson.attendeesCount += 1;
      roomDataJson.attendees.push(user);
      roomDataJson.attendeesId.push(client.id);

      await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

      client.emit(RoomEvents.ENTER_ROOM, roomDataJson);

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const attendeeSocketId = roomDataJson.attendeesId[i];
        client.to(attendeeSocketId).emit(RoomEvents.NEW_ATTENDEE, user);
      }

    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(RoomEvents.EXIT_ROOM)
  async exitRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    const userId = client['userId'];

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      "roomId",
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      "roomId",
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);


      const roomDataJson = unformatRoomData(roomData);

      const roomAdminSocketId = roomDataJson['attendeesId'][0];

      // When room admin exit room
      if (roomAdminSocketId === client.id) {
        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          const attendeeSocketId = roomDataJson.attendeesId[i];
          client.to(attendeeSocketId).emit(RoomEvents.LEAVE_ROOM);

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
          (attendeeId) => attendeeId !== client.id,
        );

        roomDataJson.attendeesCount -= 1;

        await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

        client.emit(
          RoomEvents.ATTENDEE_LEFT,
          user[0]?.username ?? user[0]?.full_name,
        );

        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          client
            .to(roomDataJson.attendeesId[i])
            .emit(
              RoomEvents.ATTENDEE_LEFT,
              user[0]?.username ?? user[0]?.full_name,
            );
        }
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(RoomEvents.REMOVE_ATTENDEE)
  async removeAttendee(@ConnectedSocket() client: Socket, @MessageBody() payload: RemoveAttendeeDto) {
    const roomId = payload.roomId;
    const attendeeId = payload.attendeeId;
    const attendeeUserId = payload.attendeeUserId;

    const publicRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PUBLIC}:${roomId}`,
      "roomId",
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      `${RoomType.PRIVATE}:${roomId}`,
      "roomId",
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);

      const roomDataJson = unformatRoomData(roomData);

      const roomAdmin = roomDataJson['attendeesId'][0];

      if (roomAdmin !== client.id) {
        return;
      }

      client.to(attendeeId).emit(RoomEvents.LEAVE_ROOM);

      const user = roomDataJson.attendees.filter(
        (attendee) => attendee.id === attendeeUserId,
      );

      roomDataJson.attendees = roomDataJson.attendees.filter(
        (attendee) => attendee.id !== attendeeUserId,
      );

      roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
        (attendee) => attendee !== attendeeId,
      );

      roomDataJson.attendeesCount -= 1;

      await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

      client.emit(RoomEvents.ATTENDEE_KICKED, user[0]);

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        client
          .to(roomDataJson.attendeesId[i])
          .emit(RoomEvents.ATTENDEE_KICKED, user[0]);
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }
}
