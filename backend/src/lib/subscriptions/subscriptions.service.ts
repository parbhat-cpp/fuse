import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionsService {
    private subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL;

    constructor() { }

    async removeUserSubscriptions(userId: string) {
        try {
            const accessResponse = await fetch(
                `${this.subscriptionServiceUrl}/v1/delete/${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!accessResponse.ok) {
                const errorData = await accessResponse.json();
                return { success: false, message: 'Failed to delete subscriptions', error: errorData };
            }
            return { success: true, message: 'Subscriptions deleted successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to delete subscriptions', error };
        }
    }
}
