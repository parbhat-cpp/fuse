import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RoomScheduler } from 'src/room-scheduler/entities/room-scheduler.entity';
import { SubscriptionsService } from 'src/lib/subscriptions/subscriptions.service';
import { NotificationsService } from 'src/lib/notifications/notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RoomScheduler])],
  controllers: [UserController],
  providers: [UserService, SubscriptionsService, NotificationsService],
})
export class UserModule {}
