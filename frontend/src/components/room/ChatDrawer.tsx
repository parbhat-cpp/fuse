import React, { useEffect, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MdSend } from "react-icons/md";
import { useSocket } from '@/socket';
import { roomData } from '@/store/room';

interface ChatDrawerDrawerProps {
    children: React.ReactNode;
}

const ChatDrawer = (props: ChatDrawerDrawerProps) => {
    const socket = useSocket("room");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!socket) return;

        socket.on("receive-message", (data) => {
            console.log(data);
        });

        return () => {
            socket.off("receive-message");
        }
    }, [socket]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message) return;

        let currentUser = localStorage.getItem("currentUser");

        if (!currentUser) return;
        const user = JSON.parse(currentUser);

        socket?.emit('send-message', {
            roomId: roomData.state?.roomId,
            userId: user?.id,
            message: message,
        });
        setMessage("");
    }

    return (
        <Drawer direction='right'>
            <DrawerTrigger asChild>
                {props.children}
            </DrawerTrigger>
            <DrawerContent>
                <div className="h-screen mx-auto w-full max-w-sm flex flex-col">
                    <DrawerHeader>
                        <DrawerTitle>Chats</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex flex-col flex-1">

                    </div>
                    <form className='p-2 pb-5 flex gap-3' onSubmit={sendMessage}>
                        <Input placeholder='Type a message' type='text' value={message} onChange={(e) => setMessage(e.target.value)} />
                        <Button variant={'outline'} type='submit'>
                            <MdSend />
                        </Button>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default ChatDrawer