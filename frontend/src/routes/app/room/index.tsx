import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { IoShareSocial } from "react-icons/io5";
import { IoMdChatbubbles } from "react-icons/io";
import { MdGroups } from "react-icons/md";
import { SlOptionsVertical } from "react-icons/sl";
import { lazy, useEffect, useState } from 'react';
import { useStore } from '@tanstack/react-store';
import toast from 'react-hot-toast';
import { currentRoomActivity, roomActivities, roomData } from '@/store/room';
import { useSocket } from '@/socket';
import AcitivitySelectNPlay from '@/components/room/RoomActivity/AcitivitySelectNPlay';
import z from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'

const ShareDialog = lazy(() => import('@/components/room/ShareDialog'));
const MembersDrawer = lazy(() => import('@/components/room/MembersDrawer'));
const ChatDrawer = lazy(() => import('@/components/room/ChatDrawer'));
const MoreOptions = lazy(() => import('@/components/room/MoreOptions'));
const LeaveBlockerDialog = lazy(() => import('@/components/room/LeaveBlockerDialog'));

const roomJoinSchema = z.object({
    roomId: z.string().min(5).or(z.number().min(5)),
    activity: z.string().optional(),
});

export const Route = createFileRoute('/app/room/')({
    validateSearch: zodValidator(roomJoinSchema),
    ssr: false,
    component: RouteComponent,
})

function RouteComponent() {
    const [currentUser] = useState(JSON.parse(localStorage.getItem("currentUser")!));

    const socket = useSocket("room");
    const navigate = useNavigate();

    const { roomId, activity } = useSearch({ from: '/app/room/' });

    const attendees = useStore(roomData, (s) => s?.attendees);
    const roomState = useStore(roomData);

    const [leavingRoom, setLeavingRoom] = useState(false);

    useEffect(() => {
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            setLeavingRoom(true);
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        if (!roomState && roomId) {
            socket.emit("join-room", { roomId, joinee: currentUser });
        }

        socket.on('enter-room', (data) => {
            roomData.setState(() => data['roomData'])
            roomActivities.setState(() => data['roomActivities'])
            currentRoomActivity.setState(
                () => data['roomData']['currentActivityData'],
            )
        });

        socket.on("new-attendee", (data) => {
            const attendee = JSON.parse(data['joinee']);

            roomData.setState(() => data['roomData']);

            toast.success(`${attendee['full_name']} joined`);
        });

        socket.on("attendee-left", (data) => {
            const attendee = JSON.parse(data['attendee']);

            roomData.setState(() => data['roomData']);

            toast.success(`${attendee['full_name']} left`);
        });

        socket.on("leave-room", (_) => {
            roomData.setState(undefined);
            navigate({
                to: "/app",
            });
        });

        socket.on("attendee-kicked", (data) => {
            const attendee = JSON.parse(data['attendee']);

            roomData.setState(() => data['roomData']);

            toast.success(`${attendee['full_name']} was kicked by admin`);
        });

        socket.on('room-not-found', (_) => {
            toast.error('Room not found')
            navigate({
                to: "/app",
            });
        })

        return () => {
            socket.off("new-attendee");
            socket.off("attendee-left");
            socket.off("leave-room");
            socket.off("attendee-kicked");
            socket.off("room-not-found");
        }
    }, [socket]);

    return <div className='flex flex-col gap-5 bg-primary-surface p-5 h-screen'>
        {/*  */}
        <div className='text-primary-paragraph flex items-center justify-between'>
            <h3>
                {roomData.state?.roomName}
            </h3>
            <div className='flex gap-4 items-center'>
                <div className='lg:hidden flex gap-4 items-center'>
                    <MembersDrawer admin={roomData.state?.admin} members={attendees}>
                        <MdGroups size={34} />
                    </MembersDrawer>
                    <ChatDrawer>
                        <IoMdChatbubbles size={25} />
                    </ChatDrawer>
                </div>
                <ShareDialog roomId={roomData.state?.roomId}>
                    <div>
                        <IoShareSocial size={25} />
                    </div>
                </ShareDialog>
            </div>
        </div>
        <div className='flex-1 bg-red-100 rounded-lg overflow-y-auto'>
            <AcitivitySelectNPlay />
        </div>
        {/* bottom bar */}
        <div className='lg:flex hidden gap-5 items-center place-self-end px-4 text-primary-paragraph'>
            <MembersDrawer admin={roomData.state?.admin} members={attendees}>
                <MdGroups size={34} />
            </MembersDrawer>
            <ChatDrawer>
                <IoMdChatbubbles size={25} />
            </ChatDrawer>
            <MoreOptions>
                <SlOptionsVertical size={20} />
            </MoreOptions>
        </div>

        {/* Blocks when a user try to leave room */}
        <LeaveBlockerDialog open={leavingRoom} onOpenChange={setLeavingRoom} />
    </div>
}
