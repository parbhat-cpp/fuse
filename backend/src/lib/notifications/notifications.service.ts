import { Injectable } from '@nestjs/common';
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
        templateId: string,
    ) {
        try {
            const response = await fetch(`${this.notificationServiceUrl}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, title, message, data, channels, templateId }),
            });

            if (response.ok) {
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            return { success: false, error };
        }
    }
}
