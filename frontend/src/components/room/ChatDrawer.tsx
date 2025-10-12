import React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'

interface ChatDrawerDrawerProps {
    children: React.ReactNode;
}

const ChatDrawer = (props: ChatDrawerDrawerProps) => {
    return (
        <Drawer direction='right'>
            <DrawerTrigger asChild>
                {props.children}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Chats</DrawerTitle>
                    </DrawerHeader>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default ChatDrawer