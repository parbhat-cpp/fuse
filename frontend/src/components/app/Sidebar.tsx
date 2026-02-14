import React, { useEffect, useState } from 'react'
import PrimaryButton from '../common/PrimaryButton'
import SidebarButton from './SidebarButton'
import { IoHomeSharp } from "react-icons/io5";
import { MdMeetingRoom } from "react-icons/md";
import { AiFillDollarCircle } from "react-icons/ai";
import { IoSettingsSharp } from "react-icons/io5";
import { useLocation } from '@tanstack/react-router';
import { BiLogOut } from "react-icons/bi";

const Sidebar = () => {
    const location = useLocation();
    const [path, setPath] = useState('/app');

    useEffect(() => {
        setPath(location.pathname);
    }, [location.pathname]);

    return (
        <aside className='sm:flex hidden h-[100dvh] bg-primary-background px-3 py-5 flex-col justify-between border-r'>
            <nav className='flex flex-col gap-3'>
                <SidebarButton
                    to='/app'
                    icon={<IoHomeSharp size={25} />}
                    text='Home'
                    currentPath={path}
                />
                <SidebarButton
                    to='/app/rooms'
                    icon={<MdMeetingRoom size={25} />}
                    text='Rooms'
                    currentPath={path}
                />
                <SidebarButton
                    to='/app/subscription'
                    icon={<AiFillDollarCircle size={25} />}
                    text='Subscription'
                    currentPath={path}
                />
                <SidebarButton
                    to='/app/settings'
                    icon={<IoSettingsSharp size={25} />}
                    text='Settings'
                    currentPath={path}
                />
            </nav>
            <PrimaryButton className='bg-red-400 flex items-center justify-center gap-2'>
                <BiLogOut />
                Log out
            </PrimaryButton>
        </aside>
    )
}

export default Sidebar