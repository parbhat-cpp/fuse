import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, OnGatewayInit, WsException } from '@nestjs/websockets';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { RoomEvents } from './events';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { randomUUID } from 'node:crypto';
import { RoomType } from './types';
import { JoinRoomDto } from './dto/join-room.dto';
import { Room } from './dto/room.dto';
import { formatRoomData, unformatRoomData } from './util';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { ChatDto } from './dto/chat.dto';
import { UserType } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: "/room",
  cors: {
    origin: "*",
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userIdToSocketId: Map<string, string> = new Map();

  constructor(
    private jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly roomsService: RoomsService,
  ) { }

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          socket.disconnect();
          throw new WsException('Authorization Error: No token provided');
        }
        const user = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET as string,
        });

        this.redisService.redis.hset(`user:${user.sub}`, { socketId: socket.id });

        socket.data.userId = user.sub;
        socket['userId'] = user.sub;

        next();
      } catch (error) {
        socket.disconnect();
        Logger.error(error);
      }
    });
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) return;

    this.userIdToSocketId.set(userId, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) return;

    this.userIdToSocketId.delete(userId);
  }

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
    payload.attendeesId = [payload.admin.id];
    payload.attendeesCount = payload.attendees.length + 1;
    const scheduleRoom = payload.startAt;
    payload.startAt = payload?.startAt ?? new Date();

    const roomData = formatRoomData(payload);

    if (payload.isPublic) {
      await this.redisService.redis.hset(`${RoomType.PUBLIC}:${roomId}`, roomData);
    } else {
      await this.redisService.redis.hset(`${RoomType.PRIVATE}:${roomId}`, roomData);
    }

    const resData = unformatRoomData(roomData);

    if (scheduleRoom)
      client.emit(RoomEvents.ROOM_SCHEDULED, {
        roomName: resData.roomName,
        roomId: resData.roomId,
        startAt: resData.startAt,
      });
    else
      client.emit(RoomEvents.ROOM_CREATED, resData);
  }

  @SubscribeMessage(RoomEvents.JOIN_ROOM)
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomDto) {
    const roomId = payload.roomId;
    const user = payload.joinee;
    const userId = client.data.userId;

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
      roomDataJson.attendeesId.push(userId);

      await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

      client.emit(RoomEvents.ENTER_ROOM, roomDataJson);

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const receiverId = this.userIdToSocketId.get(roomDataJson.attendeesId[i]);

        client.to(receiverId).emit(RoomEvents.NEW_ATTENDEE, { roomData: roomDataJson, joinee: user });
      }

    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(RoomEvents.EXIT_ROOM)
  async exitRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    const userId = client.data.userId;

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
      if (roomAdminSocketId === userId) {
        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          const receiverId = this.userIdToSocketId.get(roomDataJson.attendeesId[i]);
          client.to(receiverId).emit(RoomEvents.LEAVE_ROOM);
        }
        await this.redisService.redis.del(`${roomType}:${roomId}`);
      } else {
        // Get user info
        const user = roomDataJson.attendees.filter(
          (attendee) => JSON.parse(attendee as unknown as string).id === userId,
        );

        roomDataJson.attendees = roomDataJson.attendees.filter(
          (attendee) => JSON.parse(attendee as unknown as string).id !== userId,
        );

        // Remove user from room and update
        roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
          (attendeeId) => attendeeId !== userId,
        );

        roomDataJson.attendeesCount -= 1;

        await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

        client.emit(
          RoomEvents.ATTENDEE_LEFT,
          JSON.parse(user[0] as unknown as string)?.username ?? JSON.parse(user[0] as unknown as string)?.full_name,
        );

        for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
          const receiverId = this.userIdToSocketId.get(roomDataJson.attendeesId[i]);

          client
            .to(receiverId)
            .emit(
              RoomEvents.ATTENDEE_LEFT,
              { roomData: roomDataJson, attendee: user[0] },
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

      const roomAdminId = roomDataJson['attendeesId'][0];

      if (this.userIdToSocketId.get(roomAdminId) !== client.id) {
        return;
      }

      client.to(this.userIdToSocketId.get(attendeeUserId)).emit(RoomEvents.LEAVE_ROOM);

      const user = roomDataJson.attendees.filter(
        (attendee) => JSON.parse(attendee as unknown as string).id === attendeeUserId,
      );

      roomDataJson.attendees = roomDataJson.attendees.filter(
        (attendee) => JSON.parse(attendee as unknown as string).id !== attendeeUserId,
      );

      roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
        (attendee) => attendee !== attendeeUserId,
      );

      roomDataJson.attendeesCount -= 1;

      await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

      client.emit(RoomEvents.ATTENDEE_KICKED, { roomData: roomDataJson, attendee: user[0] });

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const receiverId = this.userIdToSocketId.get(roomDataJson.attendeesId[i]);

        client
          .to(receiverId)
          .emit(RoomEvents.ATTENDEE_KICKED, { roomData: roomDataJson, attendee: user[0] });
      }
    } else {
      client.emit(RoomEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(RoomEvents.SEND_MESSAGE)
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ChatDto) {
    const userId = payload.userId;
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
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);

      const roomDataJson = unformatRoomData(roomData);

      let user: UserType;

      if (roomDataJson.admin.id === userId) {
        user = roomDataJson.admin;
      } else {
        for (const attendee of roomDataJson.attendees) {
          const sender = JSON.parse(attendee as unknown as string);
          if (sender.id === userId)
            user = sender;
        }
      }

      for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
        const attendeeId = roomDataJson.attendeesId[i];

        if (attendeeId === userId) continue;

        const receiverId = this.userIdToSocketId.get(attendeeId);

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
}
