import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private redisService: RedisService) { }

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
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });

      this.redisService.redis.hset(`user:${user.sub}`, { socketId: socket.id });

      socket['userId'] = user.sub;

      return true;
    } catch (e) {
      socket.disconnect();
      Logger.error(e);

      return false;
    }
  }
}
