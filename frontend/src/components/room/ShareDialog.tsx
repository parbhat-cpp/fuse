import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import InputWithCopy from '../common/InputWithCopy';
import { roomJoinLink } from '@/lib/utils';

interface ShareDialogProps {
    children: React.ReactNode;
    roomId: string;
}

const ShareDialog = (props: ShareDialogProps) => {
    return (
        <Dialog>
            <DialogTrigger>
                {props.children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Room Link</DialogTitle>
                    <DialogDescription>
                        <InputWithCopy link={roomJoinLink(props.roomId)} />
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default ShareDialog