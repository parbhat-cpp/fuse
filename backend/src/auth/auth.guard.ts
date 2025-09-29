import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest() as Request;

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
      req['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
