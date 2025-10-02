import { UserType } from "src/user/entities/user.entity";
import { CreateRoomDto } from "./dto/create-room.dto";
import { Room } from "./dto/room.dto";

export const formatRoomData = (payload: CreateRoomDto): Record<string, string> => {
    return {
        admin: JSON.stringify(payload.admin),
        attendees: JSON.stringify(payload.attendees),
        attendeesId: JSON.stringify(payload.attendeesId),
        attendeesCount: payload.attendeesCount.toString(),
        isPublic: `${payload.isPublic}`,
        roomId: payload.roomId,
        roomName: payload.roomName,
        startAt: payload.startAt.toDateString(),
        createdAt: payload?.createdAt?.toDateString() ?? new Date().toDateString(),
    };
}

export const unformatRoomData = (payload: Record<string, string>): Room => {
    return {
        admin: JSON.parse(payload.admin),
        attendees: JSON.parse(payload.attendees) as UserType[],
        attendeesId: JSON.parse(payload.attendeesId) as string[],
        attendeesCount: Number(payload.attendeesCount),
        isPublic: Boolean(payload.isPublic),
        roomId: payload.roomId,
        roomName: payload.roomName,
        startAt: new Date(payload.startAt),
        createdAt: new Date(payload.createdAt),
    };
}
