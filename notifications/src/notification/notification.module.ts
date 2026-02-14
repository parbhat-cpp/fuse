import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { BullModule } from '@nestjs/bullmq';
import {
  NOTIFICATION_TYPE_EMAIL,
  NOTIFICATION_TYPE_IN_APP,
} from 'src/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Template } from 'src/template/entities/template.entity';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: NOTIFICATION_TYPE_IN_APP,
      },
      {
        name: NOTIFICATION_TYPE_EMAIL,
      },
    ),
    TypeOrmModule.forFeature([Notification, Template]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
