export const processRoomData = (payload: Record<string, string>) => {
    return {
        admin: JSON.parse(payload.admin),
        attendees: JSON.parse(payload.attendees),
        attendeesId: JSON.parse(payload.attendeesId) as string[],
        attendeesCount: Number(payload.attendeesCount),
        isPublic: Boolean(payload.isPublic),
        roomId: payload.roomId,
        roomName: payload.roomName,
        startAt: new Date(payload.startAt),
        createdAt: new Date(payload.createdAt),
    };
}