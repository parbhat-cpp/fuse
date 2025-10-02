import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { RoomEvents } from './events';
import { Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/ws-auth/ws-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { randomUUID } from 'node:crypto';
import { RoomType } from './types';
import { JoinRoomDto } from './dto/join-room.dto';
import { Room } from './dto/room.dto';
import { formatRoomData, unformatRoomData } from './util';

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

      client.to(roomDataJson.attendeesId).emit(RoomEvents.NEW_ATTENDEE, user);

      // for (let i = 0; i < roomDataJson.attendees.length - 1; i++) {
      //   const userSocketId = roomDataJson.attendeesId[i];

      //   client.to(userSocketId).emit(RoomEvents.NEW_ATTENDEE, user);
      // }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }
}
