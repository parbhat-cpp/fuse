import { Module } from '@nestjs/common';
import { MediasoupGateway } from './mediasoup.gateway';

@Module({
  providers: [MediasoupGateway]
})
export class MediasoupModule {}
