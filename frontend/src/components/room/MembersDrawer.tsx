import React, { useEffect, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { IoPersonRemove } from "react-icons/io5";
import { useSocket } from '@/socket';
import { roomData } from '@/store/room';

interface MembersDrawerProps {
    children: React.ReactNode;
    members: string[]; // storing member data as string of json
    admin: Record<string, any>;
}

const MembersDrawer = (props: MembersDrawerProps) => {
    const socket = useSocket("room");

    const [currentUser, setCurrentUser] = useState<Record<string, any>>();

    useEffect(() => {
        const user = localStorage.getItem("currentUser");

        if (!user) return;

        setCurrentUser(JSON.parse(user));
    }, []);

    const handleRemoveAttendee = (userId: string) => {
        socket?.emit("remove-attendee", {
            roomId: roomData.state?.roomId,
            attendeeUserId: userId,
        });
    }

    return (
        <Drawer direction='right'>
            <DrawerTrigger asChild>
                {props.children}
            </DrawerTrigger>
            <DrawerContent>
                <div className="h-[calc(100vh-81px)] mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Members</DrawerTitle>
                    </DrawerHeader>
                    <div className='h-full flex flex-col overflow-y-auto'>
                        <div className='flex gap-3 items-center px-4 py-2'>
                            <img src={decodeURIComponent(props.admin?.['avatar_url'])} height={50} width={50} className='rounded-full' />
                            <p className='text-xl font-semibold'>{props.admin?.['username'] ?? props.admin?.['full_name']} (Admin)</p>
                        </div>
                        {
                            props.members?.map((member: string, index: number) => {
                                const memberData = JSON.parse(member);

                                return <div key={memberData['id']} className='flex gap-3 items-center px-4 py-2'>
                                    <img src={decodeURIComponent(memberData['avatar_url'])} height={50} width={50} className='rounded-full' />
                                    <p className='text-xl font-semibold'>{memberData['username'] ?? memberData['full_name']}</p>
                                    {props.admin.id === currentUser?.id && <button className='ml-auto' onClick={() => handleRemoveAttendee(memberData['id'])}>
                                        <IoPersonRemove size={26} className='text-red-400' />
                                    </button>}
                                </div>
                            })
                        }
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default MembersDrawer