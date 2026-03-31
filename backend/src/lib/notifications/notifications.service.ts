import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';

@Injectable()
export class NotificationsService {
    private readonly notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;

    constructor() { }

    async sendNotification(
        userId: string,
        title: string,
        message: string,
        data: any,
        channels: string[],
        tag: string,
    ) {
        try {
            const response = await fetch(`${this.notificationServiceUrl}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, title, message, data, channels, tag }),
            });

            if (!response.ok) {
                return { success: false };
            }
            return { success: true };
        } catch (error) {
            Logger.error('Failed to send notification', error);
            return { success: false, error };
        }
    }

    async deleteUserNotifications(userId: string) {
        try {
            const response = await fetch(`${this.notificationServiceUrl}/delete-all/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, message: 'Failed to delete notifications', error: errorData };
            }
            return { success: true, message: 'Notifications deleted successfully' };
        } catch (error) {
            Logger.error('Failed to delete notifications', error);
            return { success: false, message: 'Failed to delete notifications', error };
        }
    }
}
