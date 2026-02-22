import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  path: '/notification-socket/',
  namespace: '/notification',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private userIdToSocketIdMap: Map<string, string> = new Map();

  afterInit(server: any) {}

  handleConnection(client: Socket) {
    Logger.log(`Client connected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userIdToSocketIdMap.set(userId, client.id);
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    Logger.log(`Client disconnected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userIdToSocketIdMap.delete(userId);
    }
  }

  toUser(userId: string) {
    const socketId = this.userIdToSocketIdMap.get(userId);
    if (socketId) {
      return this.server.to(socketId);
    }
    return null;
  }
}
