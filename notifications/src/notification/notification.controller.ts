import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { UUID } from 'node:crypto';
import { NOTIFICATION_TYPE } from 'src/template/types';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // to be used by other services to push notifications to users
  @Post('notify')
  async notify(
    @Body()
    body: {
      userId: UUID;
      title: string;
      message: string;
      data: any;
      channels: string[];
      tag: string;
    },
  ) {
    await this.notificationService.pushNotification(
      body.userId,
      body.title,
      body.message,
      body.data,
      body.channels,
      body.tag,
    );
  }

  // to be used by other services to save notifications
  @Post('save')
  async saveNotification(
    @Body()
    body: {
      userId: UUID;
      title: string;
      message: string;
      data: any;
      type: NOTIFICATION_TYPE;
      templateId: UUID;
    },
  ) {
    return await this.notificationService.saveNotification(
      body.userId,
      body.title,
      body.message,
      body.data,
      body.type,
      body.templateId,
    );
  }

  @Get('sync')
  async syncNotifications(
    @Req() request: Request,
    @Query('cursor') cursor: string,
  ) {
    const userId = request.headers['x-user-id'] as UUID;
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return await this.notificationService.syncNotifications(userId, cursor);
  }

  @Get()
  async getNotification(
    @Req() request: Request,
    @Query('cursor') cursor?: string,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    const userId = request.headers['x-user-id'] as UUID;
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    return await this.notificationService.getNotifications(
      userId,
      cursor,
      limit,
    );
  }

  @Patch('mark-as-read')
  async markAsRead(
    @Query('notificationId', ParseUUIDPipe) notificationId: UUID,
  ) {
    return await this.notificationService.markAsRead(notificationId);
  }

  @Delete('delete')
  async deleteNotification(
    @Query('notificationId', ParseUUIDPipe) notificationId: UUID,
  ) {
    return await this.notificationService.deleteNotification(notificationId);
  }

  @Patch('mark-all-as-read')
  async markAllAsRead(@Req() request: Request) {
    const userId = request.headers['x-user-id'] as UUID;
    if (!userId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return await this.notificationService.markAllAsRead(userId);
  }
}
