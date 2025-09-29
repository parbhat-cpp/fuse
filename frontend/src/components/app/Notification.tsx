import React from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { IoIosNotifications } from 'react-icons/io'

const Notification = () => {
    return (
        <Drawer direction='right'>
            <DrawerTrigger>
                <IoIosNotifications size={28} className='cursor-pointer' />
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Notification</DrawerTitle>
                </DrawerHeader>
                <DrawerFooter>
                    <DrawerClose>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

export default Notification