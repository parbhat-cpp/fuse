import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { formatRoomData, unformatRoomData } from './util';
import { RoomEvents } from './events';
import { randomUUID } from 'node:crypto';
import { RoomType } from './types';
import { JoinRoomDto } from './dto/join-room.dto';
import { Room } from './dto/room.dto';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { ChatDto } from './dto/chat.dto';
import { UserType } from 'src/user/entities/user.entity';

@Injectable()
export class RoomsService {
    constructor(
        private readonly redisService: RedisService,
    ) { }

    async createRoom(client: Socket, payload: CreateRoomDto) {
        payload.roomId = payload?.roomId ?? randomUUID().substring(0, 5);
        const roomId = payload.roomId;

        const publicRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PUBLIC}:${roomId}`,
            "roomId",
        );

        const privateRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PRIVATE}:${roomId}`,
            "roomId",
        );

        if (publicRoomExists || privateRoomExists) {
            client.emit(RoomEvents.ROOM_EXISTS);
            return;
        }

        payload.attendees = [];
        payload.attendeesId = [payload.admin.id];
        payload.attendeesCount = payload.attendees.length + 1;
        const scheduleRoom = payload.startAt;
        payload.startAt = payload?.startAt ?? new Date();

        const roomData = formatRoomData(payload);

        if (payload.isPublic) {
            await this.redisService.redis.hset(`${RoomType.PUBLIC}:${roomId}`, roomData);
        } else {
            await this.redisService.redis.hset(`${RoomType.PRIVATE}:${roomId}`, roomData);
        }

        const resData = unformatRoomData(roomData);

        if (scheduleRoom)
            client.emit(RoomEvents.ROOM_SCHEDULED, {
                roomName: resData.roomName,
                roomId: resData.roomId,
                startAt: resData.startAt,
            });
        else
            client.emit(RoomEvents.ROOM_CREATED, resData);
    }

    async joinRoom(client: Socket, payload: JoinRoomDto, userIdToSocketId: Map<string, string>) {
        const roomId = payload.roomId;
        const user = payload.joinee;
        const userId = client.data.userId;

        if (!roomId) {
            client.emit(RoomEvents.ROOM_NOT_FOUND);
            return;
        }

        const publicRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PUBLIC}:${roomId}`,
            'roomId',
        );

        const privateRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PRIVATE}:${roomId}`,
            'roomId',
        );

        if (publicRoomExists || privateRoomExists) {
            let roomType = '';

            if (publicRoomExists) {
                roomType = RoomType.PUBLIC;
            }

            if (privateRoomExists) {
                roomType = RoomType.PRIVATE;
            }

            const roomData = await this.redisService.redis.hgetall(
                `${roomType}:${roomId}`,
            );

            const roomDataJson: Room = unformatRoomData(roomData);

            if (
                !roomDataJson.admin.premium_account &&
                roomDataJson.attendeesCount === 5
            ) {
                client.emit(RoomEvents.ROOM_LIMIT_REACHED);
                return;
            }

            roomDataJson.attendeesCount += 1;
            roomDataJson.attendees.push(user);
            roomDataJson.attendeesId.push(userId);

            await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

            client.emit(RoomEvents.ENTER_ROOM, roomDataJson);

            for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
                const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

                client.to(receiverId).emit(RoomEvents.NEW_ATTENDEE, { roomData: roomDataJson, joinee: user });
            }
        } else {
            client.emit(RoomEvents.ROOM_NOT_FOUND);
        }
    }

    async exitRoom(client: Socket, roomId: string, userId: string, userIdToSocketId: Map<string, string>) {
        const publicRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PUBLIC}:${roomId}`,
            "roomId",
        );

        const privateRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PRIVATE}:${roomId}`,
            "roomId",
        );

        if (publicRoomExists || privateRoomExists) {
            let roomType = '';

            if (publicRoomExists) {
                roomType = RoomType.PUBLIC;
            } else {
                roomType = RoomType.PRIVATE;
            }

            const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);

            const roomDataJson = unformatRoomData(roomData);

            const roomAdminSocketId = roomDataJson['attendeesId'][0];

            // When room admin exit room
            if (roomAdminSocketId === userId) {
                for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
                    const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);
                    client.to(receiverId).emit(RoomEvents.LEAVE_ROOM);
                }
                await this.redisService.redis.del(`${roomType}:${roomId}`);
            } else {
                // Get user info
                const user = roomDataJson.attendees.filter(
                    (attendee) => JSON.parse(attendee as unknown as string).id === userId,
                );

                roomDataJson.attendees = roomDataJson.attendees.filter(
                    (attendee) => JSON.parse(attendee as unknown as string).id !== userId,
                );

                // Remove user from room and update
                roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
                    (attendeeId) => attendeeId !== userId,
                );

                roomDataJson.attendeesCount -= 1;

                await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

                client.emit(
                    RoomEvents.ATTENDEE_LEFT,
                    JSON.parse(user[0] as unknown as string)?.username ?? JSON.parse(user[0] as unknown as string)?.full_name,
                );

                for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
                    const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

                    client
                        .to(receiverId)
                        .emit(
                            RoomEvents.ATTENDEE_LEFT,
                            { roomData: roomDataJson, attendee: user[0] },
                        );
                }
            }
        } else {
            client.emit(RoomEvents.ROOM_NOT_FOUND);
        }
    }

    async removeAttendee(client: Socket, payload: RemoveAttendeeDto, userIdToSocketId: Map<string, string>) {
        const roomId = payload.roomId;
        const attendeeUserId = payload.attendeeUserId;

        const publicRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PUBLIC}:${roomId}`,
            "roomId",
        );

        const privateRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PRIVATE}:${roomId}`,
            "roomId",
        );

        if (publicRoomExists || privateRoomExists) {
            let roomType = '';

            if (publicRoomExists) {
                roomType = RoomType.PUBLIC;
            } else {
                roomType = RoomType.PRIVATE;
            }

            const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);

            const roomDataJson = unformatRoomData(roomData);

            const roomAdminId = roomDataJson['attendeesId'][0];

            if (userIdToSocketId.get(roomAdminId) !== client.id) {
                return;
            }

            client.to(userIdToSocketId.get(attendeeUserId)).emit(RoomEvents.LEAVE_ROOM);

            const user = roomDataJson.attendees.filter(
                (attendee) => JSON.parse(attendee as unknown as string).id === attendeeUserId,
            );

            roomDataJson.attendees = roomDataJson.attendees.filter(
                (attendee) => JSON.parse(attendee as unknown as string).id !== attendeeUserId,
            );

            roomDataJson.attendeesId = roomDataJson.attendeesId.filter(
                (attendee) => attendee !== attendeeUserId,
            );

            roomDataJson.attendeesCount -= 1;

            await this.redisService.redis.hset(`${roomType}:${roomId}`, formatRoomData(roomDataJson));

            client.emit(RoomEvents.ATTENDEE_KICKED, { roomData: roomDataJson, attendee: user[0] });

            for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
                const receiverId = userIdToSocketId.get(roomDataJson.attendeesId[i]);

                client
                    .to(receiverId)
                    .emit(RoomEvents.ATTENDEE_KICKED, { roomData: roomDataJson, attendee: user[0] });
            }
        } else {
            client.emit(RoomEvents.ROOM_NOT_FOUND);
        }
    }

    async sendMessage(client: Socket, payload: ChatDto, userIdToSocketId: Map<string, string>) {
        const userId = payload.userId;
        const roomId = payload.roomId;

        const publicRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PUBLIC}:${roomId}`,
            "roomId",
        );

        const privateRoomExists = await this.redisService.redis.hexists(
            `${RoomType.PRIVATE}:${roomId}`,
            "roomId",
        );

        if (publicRoomExists || privateRoomExists) {
            let roomType = '';

            if (publicRoomExists) {
                roomType = RoomType.PUBLIC;
            } else {
                roomType = RoomType.PRIVATE;
            }

            const roomData = await this.redisService.redis.hgetall(`${roomType}:${roomId}`);

            const roomDataJson = unformatRoomData(roomData);

            let user: UserType;

            if (roomDataJson.admin.id === userId) {
                user = roomDataJson.admin;
            } else {
                for (const attendee of roomDataJson.attendees) {
                    const sender = JSON.parse(attendee as unknown as string);
                    if (sender.id === userId)
                        user = sender;
                }
            }

            for (let i = 0; i < roomDataJson.attendeesId.length; i++) {
                const attendeeId = roomDataJson.attendeesId[i];

                if (attendeeId === userId) continue;

                const receiverId = userIdToSocketId.get(attendeeId);

                client.to(receiverId).emit(RoomEvents.RECEIVE_MESSAGE, {
                    sendBy: user,
                    message: payload.message,
                    sentAt: new Date().toISOString(),
                });
            }
        } else {
            client.emit(RoomEvents.ROOM_NOT_FOUND);
        }
    }
}
