import { useSocket } from '@/socket'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/app/')({
    component: RouteComponent,
})

function RouteComponent() {
    const socket = useSocket("room");

    useEffect(() => {
        if (!socket) return;
    }, []);

    const handleCreateRoom = () => {
        try {
            const user = localStorage.getItem("currentUser");
            socket.emit("create-room", {
                "admin": JSON.parse(user!),
                "roomId": "123456",
                "roomName": "abcd",
                "isPublic": true,
            });
        } catch (error) {
            console.log(error);
        }
    }

    return <div className='flex-1' onClick={handleCreateRoom}>Hello "/app/"!</div>
}
