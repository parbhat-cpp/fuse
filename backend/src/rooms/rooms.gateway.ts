import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, OnGatewayInit, WsException } from '@nestjs/websockets';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { RoomEvents } from './events';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { ChatDto } from './dto/chat.dto';
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
    await this.roomsService.createRoom(client, payload);
  }

  @SubscribeMessage(RoomEvents.JOIN_ROOM)
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomDto) {
    await this.roomsService.joinRoom(client, payload, this.userIdToSocketId);
  }

  @SubscribeMessage(RoomEvents.EXIT_ROOM)
  async exitRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    const userId = client.data.userId;

    await this.roomsService.exitRoom(client, roomId, userId, this.userIdToSocketId);
  }

  @SubscribeMessage(RoomEvents.REMOVE_ATTENDEE)
  async removeAttendee(@ConnectedSocket() client: Socket, @MessageBody() payload: RemoveAttendeeDto) {
    await this.roomsService.removeAttendee(client, payload, this.userIdToSocketId);
  }

  @SubscribeMessage(RoomEvents.SEND_MESSAGE)
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ChatDto) {
    await this.roomsService.sendMessage(client, payload, this.userIdToSocketId);
  }
}
