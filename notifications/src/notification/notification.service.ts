import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  NOTIFICATION_TYPE_EMAIL,
  NOTIFICATION_TYPE_IN_APP,
} from 'src/constants';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Template } from 'src/template/entities/template.entity';
import { UUID } from 'node:crypto';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NOTIFICATION_TYPE_IN_APP) private inAppQueue: Queue,
    @InjectQueue(NOTIFICATION_TYPE_EMAIL) private emailQueue: Queue,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async pushNotification(
    userId: UUID,
    title: string,
    message: string,
    data: any,
    type: string,
    channels: string[],
    templateId: UUID,
  ) {
    if (channels.includes(NOTIFICATION_TYPE_IN_APP)) {
      return await this.pushInApp(userId, title, message, data, type, templateId);
    }
    if (channels.includes(NOTIFICATION_TYPE_EMAIL)) {
      return await this.pushEmail(
        userId,
        title,
        message,
        data,
        type,
        templateId,
      );
    }
  }

  private async pushInApp(
    userId: UUID,
    title: string,
    message: string,
    data: any,
    type: string,
    templateId: UUID,
  ) {
    try {
      await this.inAppQueue.add(
        'in-app-notification',
        {
          userId,
          title,
          message,
          data,
          type,
          templateId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to push in-app notification', error);
      return { success: false, error: error.message };
    }
  }

  private async pushEmail(
    userId: UUID,
    title: string,
    message: string,
    data: any,
    type: string,
    templateId: UUID,
  ) {
    try {
      await this.emailQueue.add(
        'email-notification',
        {
          userId,
          title,
          message,
          data,
          type,
          templateId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to push email notification', error);
      return { success: false, error: error.message };
    }
  }

  async markAsRead(notificationId: UUID) {
    try {
      const updatedNotification = await this.notificationRepository.update({ id: notificationId }, { read: true });
      return { success: true, data: updatedNotification };
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      return { success: false, error: error.message };
    }
  }

  async deleteNotification(notificationId: UUID) {
    try {
      const deleteResult = await this.notificationRepository.delete({ id: notificationId });
      return { success: true, data: deleteResult };
    } catch (error) {
      this.logger.error('Failed to delete notification', error);
      return { success: false, error: error.message };
    }
  }

  async markAllAsRead(userId: UUID) {
    try {
      const updateResult = await this.notificationRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ read: true })
        .where('recipient_id = :userId', { userId })
        .execute();
      return { success: true, data: updateResult };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
      return { success: false, error: error.message };
    }
  }

  // only for internal use, utilized by workers to save notifications to DB after processing
  async saveNotification(
    userId: UUID,
    title: string,
    message: string,
    data: any,
    type: string,
    templateId: UUID,
  ) {
    try {
      const notification = await this.notificationRepository.insert({
        recipient_id: userId,
        title,
        message,
        data,
        type: type as 'email' | 'push',
        template: { id: templateId },
        read: false,
      });

      if (notification.identifiers.length === 0) {
        throw new Error('Failed to save notification');
      }

      const savedNotification = await this.notificationRepository
        .createQueryBuilder('n')
        .innerJoin(Template, 't', 'n.template_id = t.id')
        .where('n.id = :id', { id: notification.identifiers[0].id })
        .select(['n', 't'])
        .getRawOne();

      const userSocket = this.notificationGateway.toUser(userId);
      if (userSocket) {
        userSocket.emit('new-notification', savedNotification);
      }
      return { success: true, notificationId: notification.identifiers[0].id };
    } catch (error) {
      this.logger.error('Failed to save notification', error);
      return { success: false, error: error.message };
    }
  }

  async getNotificationHistory(userId: UUID) {
    try {
      const notifications = await this.notificationRepository
        .createQueryBuilder('n')
        .select([
          'JSON_AGG(n order by n.created_at) as notifications',
          'JSON_AGG(t order by t.created_at) as templates',
        ])
        .addSelect('DATE(n.created_at)', 'created_date')
        .innerJoin(Template, 't', 'n.template_id = t.id')
        .where('n.recipient_id = :userId', { userId })
        .groupBy('created_date')
        .orderBy('created_date', 'DESC')
        .getRawMany();
      return notifications;
    } catch (error) {
      this.logger.error('Failed to get notification history', error);
      return [];
    }
  }
}
