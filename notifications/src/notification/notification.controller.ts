import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { UUID } from 'node:crypto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('notify')
  async notify(
    @Body()
    body: {
      userId: UUID;
      title: string;
      message: string;
      data: any;
      type: string;
      channels: string[];
      templateId: UUID;
    },
  ) {
    await this.notificationService.pushNotification(
      body.userId,
      body.title,
      body.message,
      body.data,
      body.type,
      body.channels,
      body.templateId,
    );
  }

  @Post('save')
  async saveNotification(
    @Body()
    body: {
      userId: UUID;
      title: string;
      message: string;
      data: any;
      type: string;
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

  @Get('history')
  async history(@Req() request: Request) {
    const userId = request.headers['X-User-Id'] as UUID;
    if (!userId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return await this.notificationService.getNotificationHistory(userId);
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
    const userId = request.headers['X-User-Id'] as UUID;
    if (!userId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return await this.notificationService.markAllAsRead(userId);
  }
}
