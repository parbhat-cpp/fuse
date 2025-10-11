"use client";

import InputWithCopy from '@/components/common/InputWithCopy';
import Create from '@/components/forms/room/Create';
import Join from '@/components/forms/room/Join';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canJoinRoom, roomJoinLink, toLocalDate } from '@/lib/utils';
import { useSocket } from '@/socket';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/app/')({
    component: RouteComponent,
})

function RouteComponent() {
    const socket = useSocket("room");
    const [openRoomScheduledDialog, setOpenRoomScheduledDialog] = useState(false);
    const [openDenyRoomJoinDialog, setOpenDenyRoomJoinDialog] = useState(false);
    const [scheduledRoomData, setScheduledRoomData] = useState<Record<string, any> | undefined>(undefined);

    useEffect(() => {
        if (!socket) return;

        socket?.on("room-created", (data) => {
            console.log(data);
        });

        socket?.on("room-scheduled", (data) => {
            setScheduledRoomData(data);
            setOpenRoomScheduledDialog(true);
        });

        socket.on("room-not-found", (_) => {
            toast.error("Room not found");
        });

        socket.on("room-limit-reached", (_) => {
            toast.error("Room is full");
        });

        socket.on("enter-room", (data) => {
            if (!canJoinRoom(toLocalDate(data['startAt']))) {
                setOpenDenyRoomJoinDialog(true);
                setScheduledRoomData({
                    roomName: data['roomName'],
                    roomId: data['roomId'],
                    startAt: data['startAt'],
                });
            } else {
                console.log(data);
            }
        });

        return () => {
            socket.off("room-created");
            socket.off("room-scheduled");
            socket.off("room-not-found");
            socket.off("room-limit-reached");
            socket.off("enter-room");
        }
    }, [socket]);

    const handleRoomCreation = (roomName: string, roomId: string | undefined, isPublic: boolean, startAt: Date | undefined) => {
        try {
            const currentUser = localStorage.getItem("currentUser");

            if (!currentUser) return;

            socket?.emit("create-room", {
                roomName, roomId, isPublic, startAt, admin: JSON.parse(currentUser),
            });
        } catch (error) {
            toast.error("Failed to create room");
        }
    }

    const handleRoomJoin = (roomId: string) => {
        const currentUser = localStorage.getItem("currentUser");

        if (!currentUser) return;

        socket?.emit("join-room", {
            "joinee": currentUser,
            "roomId": roomId,
        });
    }

    return <div className='flex-1 flex justify-center items-center'>
        <div className='md:w-[60vw] sm:w-[70vw] w-[95vw] p-7 bg-white rounded-xl space-y-3'>
            <Tabs defaultValue="create">
                <TabsList>
                    <TabsTrigger value="create">Create</TabsTrigger>
                    <TabsTrigger value="join">Join</TabsTrigger>
                </TabsList>
                <TabsContent value="create">
                    <Create onSubmit={handleRoomCreation} />
                </TabsContent>
                <TabsContent value="join">
                    <Join onSubmit={handleRoomJoin} />
                </TabsContent>
            </Tabs>
        </div>

        <Dialog open={openRoomScheduledDialog} onOpenChange={(open) => setOpenRoomScheduledDialog(open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Room Scheduled</DialogTitle>
                    <DialogDescription>
                        You just scheduled a room. Connect at specified date and time using the link below or join using the room ID.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-2 text-lg'>
                    <p><span className='font-semibold'>Room name:</span> {scheduledRoomData?.['roomName']}</p>
                    <p><span className='font-semibold'>Scheduled at:</span> {toLocalDate(scheduledRoomData?.['startAt'])}</p>
                    <p><span className='font-semibold'>Room ID:</span> {scheduledRoomData?.['roomId']}</p>
                    <InputWithCopy link={roomJoinLink(scheduledRoomData?.['roomId'])} />
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={openDenyRoomJoinDialog} onOpenChange={(open) => setOpenDenyRoomJoinDialog(open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cannot Join Room</DialogTitle>
                    <DialogDescription>
                        This room is scheduled. Connect at specified date and time using the link below or join using the room ID.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-2 text-lg'>
                    <p><span className='font-semibold'>Room name:</span> {scheduledRoomData?.['roomName']}</p>
                    <p><span className='font-semibold'>Scheduled at:</span> {toLocalDate(scheduledRoomData?.['startAt'])}</p>
                    <p><span className='font-semibold'>Room ID:</span> {scheduledRoomData?.['roomId']}</p>
                    <InputWithCopy link={roomJoinLink(scheduledRoomData?.['roomId'])} />
                </div>
            </DialogContent>
        </Dialog>
    </div>
}
