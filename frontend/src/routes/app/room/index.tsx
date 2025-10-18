import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { IoMdVideocam } from "react-icons/io";
import { IoVideocamOff } from "react-icons/io5";
import { FaMicrophone } from "react-icons/fa";
import { FaMicrophoneSlash } from "react-icons/fa";
import { MdOutlineScreenShare } from "react-icons/md";
import { MdOutlineStopScreenShare } from "react-icons/md";
import { IoShareSocial } from "react-icons/io5";
import { ImPhoneHangUp } from "react-icons/im";
import { IoMdChatbubbles } from "react-icons/io";
import { MdGroups } from "react-icons/md";
import { SlOptionsVertical } from "react-icons/sl";
import { lazy, useEffect, useState } from 'react';
import { roomData } from '@/store/room';
import { useSocket } from '@/socket';
import toast from 'react-hot-toast';
import { useStore } from '@tanstack/react-store';

const ShareDialog = lazy(() => import('@/components/room/ShareDialog'));
const MembersDrawer = lazy(() => import('@/components/room/MembersDrawer'));
const ChatDrawer = lazy(() => import('@/components/room/ChatDrawer'));
const MoreOptions = lazy(() => import('@/components/room/MoreOptions'));
const LeaveBlockerDialog = lazy(() => import('@/components/room/LeaveBlockerDialog'));

export const Route = createFileRoute('/app/room/')({
    component: RouteComponent,
})

function RouteComponent() {
    const socket = useSocket("room");
    const navigate = useNavigate();

    const attendees = useStore(roomData, (s) => s?.attendees);

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

        return () => {
            socket.off("new-attendee");
            socket.off("attendee-left");
            socket.off("leave-room");
            socket.off("attendee-kicked");
        }
    }, [socket]);

    return <div className='flex flex-col gap-5 bg-primary-surface p-5 h-screen'>
        {/*  */}
        <div className='text-primary-paragraph flex items-center justify-between'>
            <h3>
                {roomData.state?.roomName}
            </h3>
            <div className='flex gap-4 items-center'>
                <div className='lg:hidden block flex gap-4 items-center'>
                    <MembersDrawer admin={roomData.state?.admin} members={attendees}>
                        <MdGroups size={34} />
                    </MembersDrawer>
                    <ChatDrawer>
                        <IoMdChatbubbles size={25} />
                    </ChatDrawer>
                </div>
                <ShareDialog roomId={roomData.state?.roomId}>
                    <button>
                        <IoShareSocial size={25} />
                    </button>
                </ShareDialog>
            </div>
        </div>
        {/* member's video */}
        <div className='flex-1 bg-red-100 rounded-lg'>

        </div>
        {/* bottom bar */}
        <div className='grid lg:grid-cols-3 grid-cols-1 items-center'>
            <div className='lg:col-start-2'>
                <div className='flex gap-5 justify-evenly p-3 rounded-lg bg-primary-background text-primary-paragraph'>
                    <IoMdVideocam size={25} />
                    <FaMicrophone size={25} />
                    <MdOutlineScreenShare size={25} />
                    <ImPhoneHangUp size={25} />
                    <div className='lg:hidden block'>
                        <MoreOptions>
                            <SlOptionsVertical size={20} />
                        </MoreOptions>
                    </div>
                </div>
            </div>
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
        </div>

        {/* Blocks when a user try to leave room */}
        <LeaveBlockerDialog open={leavingRoom} onOpenChange={setLeavingRoom} />
    </div>
}
