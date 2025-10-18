import React, { useEffect, useRef, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MdSend } from "react-icons/md";
import { useSocket } from '@/socket';
import { roomData } from '@/store/room';
import { getLocalTime } from '@/lib/utils';

interface ChatDrawerDrawerProps {
    children: React.ReactNode;
}

const ChatDrawer = (props: ChatDrawerDrawerProps) => {
    const socket = useSocket("room");

    const chatRef = useRef<HTMLDivElement>(null);
    const [currUser, setCurrUser] = useState(null);
    const [message, setMessage] = useState("");
    const [roomMessages, setRoomMessages] = useState<Array<Record<string, any>>>([]);

    useEffect(() => {
        let currentUser = localStorage.getItem("currentUser");
        setCurrUser(JSON.parse(currentUser!));

        if (!socket) return;

        socket.on("receive-message", (data) => {
            setRoomMessages((prev) => [
                ...prev,
                data
            ]);
        });

        return () => {
            socket.off("receive-message");
        }
    }, [socket]);

    useEffect(() => {
        const chatBox = chatRef.current;

        if (!chatBox) return;

        chatBox.scrollTop = chatBox.scrollHeight;
    }, [roomMessages]);

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
        setRoomMessages((prev) => [
            ...prev,
            {
                sendBy: user,
                message: message,
                sentAt: new Date().toISOString(),
            }
        ]);
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
                    <div ref={chatRef} className="flex flex-col flex-1 overflow-y-auto">
                        {
                            roomMessages.map((text, i) => (
                                <div key={text['sendBy']['id'] + i} className='px-3 py-2'>
                                    <div className='flex justify-between items-center'>
                                        <span className='text-sm'>{text['sendBy']['id'] === currUser?.['id'] ? "Me" : text['sendBy']['username'] ?? text['sendBy']['full_name']}</span>
                                        <span className='text-sm'>{getLocalTime(text['sentAt'])}</span>
                                    </div>
                                    <p className='text-lg'>{text['message']}</p>
                                </div>
                            ))
                        }
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