import { Injectable } from '@nestjs/common';
import 'dotenv/config';

/**
 * Service to communicate with Subscription microservice to check user access rights.
 */
@Injectable()
export class AccessService {
  private subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL;

  constructor() {}

  async hasAccess(userId: string, accessType: string) {
    try {
      const accessResponse = await fetch(
        `${this.subscriptionServiceUrl}/v1/access?user_id=${userId}&access_request=${accessType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        return { success: true, data: accessData };
      }
      return { success: false, data: null };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
