import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const socket = context.switchToWs().getClient<Socket>();
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      socket.disconnect();
      throw new WsException('Authorization Error: No token provided');
    }

    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
      socket['user'] = {
        socketId: socket.id,
      };

      return true;
    } catch (e) {
      socket.disconnect();
      Logger.error(e);

      return false;
    }
  }
}
