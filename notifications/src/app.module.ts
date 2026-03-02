import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateModule } from './template/template.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NotificationModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [],
      synchronize: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
    }),
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}
