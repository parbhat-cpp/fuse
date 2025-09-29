import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { SocketModule } from './socket/socket.module';
import { JwtModule } from '@nestjs/jwt';
import { RoomsModule } from './rooms/rooms.module';
import 'dotenv/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [],
      synchronize: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
    }),
    UserModule,
    SocketModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '60s' },
    }),
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
