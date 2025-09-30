import { ConnectedSocket, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { RedisService } from 'src/redis/redis.service';
import { RoomsService } from './rooms.service';
import { RoomEvents } from './events';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/ws-auth/ws-auth.guard';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  namespace: "/room",
  cors: {
    origin: "*",
  },
})
export class RoomsGateway {
  constructor(
    private readonly redis: RedisService,
    private readonly roomsService: RoomsService,
  ) { }

  @SubscribeMessage(RoomEvents.CREATE_ROOM)
  createRoom(@ConnectedSocket() client: Socket, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage(RoomEvents.JOIN_ROOM)
  joinRoom(@ConnectedSocket() client: Socket, payload: any): string {
    return 'Hello world!';
  }
}
