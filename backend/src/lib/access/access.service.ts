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

      const accessData = await accessResponse.json();
      if (!accessResponse.ok) {
        return { success: false, data: accessData.data, error: accessData.error };
      }
      return { success: true, data: accessData };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
