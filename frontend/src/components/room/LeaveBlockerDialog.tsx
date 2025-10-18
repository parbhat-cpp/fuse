import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { roomData } from '@/store/room';
import { useNavigate } from '@tanstack/react-router';
import { useSocket } from '@/socket';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface LeaveBlockerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const LeaveBlockerDialog = (props: LeaveBlockerDialogProps) => {
    const socket = useSocket("room");
    const navigator = useNavigate();

    useEffect(() => {
        if (!socket) return;

        socket.on("leave-room", (_) => {
            roomData.setState(undefined);
            navigator({
                to: "/app",
            });
        });

        socket.on("attendee-left", (data) => {
            toast.success(`${data} left`);
        });

        return () => {
            socket.off("leave-room");
            socket.off("attendee-left");
        };
    }, [socket]);

    const handleClose = () => {
        props.onOpenChange(false);
    }

    const handleRedirect = () => {
        socket?.emit("exit-room", roomData.state?.roomId);

        roomData.setState(undefined);
        navigator({
            to: '/app',
        });
    }

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sure you want to leave?</DialogTitle>
                </DialogHeader>
                <div className='flex gap-3'>
                    <Button variant={'destructive'} onClick={handleRedirect}>
                        Yes
                    </Button>
                    <Button onClick={handleClose}>
                        No
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default LeaveBlockerDialog