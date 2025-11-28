import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RoomsService } from '../rooms.service';
import { RoomEvents, YTEvents } from '../events';
import { RedisService } from 'src/redis/redis.service';
import { formatRoomData } from '../util';

@Injectable()
export class YtService {
    constructor(
        private readonly redisService: RedisService,
        private readonly roomService: RoomsService,
    ) { }

    async setVideo(client: Socket, roomId: string, videoId: string, userIdToSocketId: Map<string, string>) {
        const userId = client.data.userId;
        const username = client.data.userName;
        const { exists, isMember, roomData, roomType } = await this.roomService.roomExists(roomId, userId);

        if (!exists)
            client.emit(RoomEvents.ROOM_NOT_FOUND);

        if (!isMember)
            client.emit(RoomEvents.NOT_MEMBER);

        roomData.currentActivityData = {
            videoId,
        };

        this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomData));

        for (let i = 0; i < roomData.attendeesId.length; i++) {
            let attendeeId = roomData.attendeesId[i];
            client.to(userIdToSocketId.get(attendeeId)).emit(YTEvents.SET_VIDEO_ID, { videoId, username });
        }
    }

    async playVideo(client: Socket, roomId: string, userIdToSocketId: Map<string, string>) {
        const userId = client.data.userId;
        const username = client.data.userName;

        const { exists, isMember, roomData } = await this.roomService.roomExists(roomId, userId);

        if (!exists)
            client.emit(RoomEvents.ROOM_NOT_FOUND);

        if (!isMember)
            client.emit(RoomEvents.NOT_MEMBER);

        for (let i = 0; i < roomData.attendeesId.length; i++) {
            let attendeeId = roomData.attendeesId[i];
            client.to(userIdToSocketId.get(attendeeId)).emit(YTEvents.SET_VIDEO_PLAY, username);
        }
    }

    async pauseVideo(client: Socket, roomId: string, userIdToSocketId: Map<string, string>) {
        const userId = client.data.userId;
        const username = client.data.userName;

        const { exists, isMember, roomData } = await this.roomService.roomExists(roomId, userId);

        if (!exists)
            client.emit(RoomEvents.ROOM_NOT_FOUND);

        if (!isMember)
            client.emit(RoomEvents.NOT_MEMBER);

        for (let i = 0; i < roomData.attendeesId.length; i++) {
            let attendeeId = roomData.attendeesId[i];
            client.to(userIdToSocketId.get(attendeeId)).emit(YTEvents.SET_VIDEO_PAUSE, username);
        }
    }

    async seekVideo(client: Socket, roomId: string, position: string, userIdToSocketId: Map<string, string>) {
        const userId = client.data.userId;
        const username = client.data.userName;

        const { exists, isMember, roomData } = await this.roomService.roomExists(roomId, userId);

        if (!exists)
            client.emit(RoomEvents.ROOM_NOT_FOUND);

        if (!isMember)
            client.emit(RoomEvents.NOT_MEMBER);

        for (let i = 0; i < roomData.attendeesId.length; i++) {
            let attendeeId = roomData.attendeesId[i];
            client.to(userIdToSocketId.get(attendeeId)).emit(YTEvents.SEEK_VIDEO_TO, { username, position });
        }
    }
}
