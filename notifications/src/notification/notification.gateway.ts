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
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  path: '/notification-socket/',
  namespace: '/notification',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private userIdToSocketIdMap: Map<string, string> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: any) {
    server.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          socket.disconnect();
          throw new WsException('Authorization Error: No token provided');
        }
        const user = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET as string,
        });

        socket.data.userId = user.sub;
        socket.data.userName = user.username ?? user.full_name;

        next();
      } catch (error) {
        socket.disconnect();
        Logger.error(error);
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.userId as string;
    if (userId) {
      this.userIdToSocketIdMap.set(userId, client.id);
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (userId) {
      this.userIdToSocketIdMap.delete(userId);
    }
  }

  toUser(userId: string) {
    const socketId = this.userIdToSocketIdMap.get(userId);
    if (socketId) {
      Logger.log(`Found socket ID ${socketId} for user ${userId}`);
      return this.server.to(socketId);
    }
    Logger.warn(`No socket found for user ${userId}`);
    return null;
  }
}
