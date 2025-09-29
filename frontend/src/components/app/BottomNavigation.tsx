import React, { useEffect, useState } from 'react'
import BottomNavigationButton from './BottomNavigationButton'
import { useLocation } from '@tanstack/react-router';
import { IoHomeSharp } from "react-icons/io5";
import { MdMeetingRoom } from "react-icons/md";
import { FaUserGroup } from "react-icons/fa6";
import { AiFillDollarCircle } from "react-icons/ai";
import { IoSettingsSharp } from "react-icons/io5";

const BottomNavigation = () => {
    const location = useLocation();
    const [path, setPath] = useState('/app');

    useEffect(() => {
        setPath(location.pathname);
    }, [location.pathname]);

    return (
        <div className='sm:hidden flex justify-evenly items-center w-full bg-primary-background text-primary-paragraph p-3'>
            <BottomNavigationButton
                currentPath={path}
                icon={<IoHomeSharp />}
                to='/app' />
            <BottomNavigationButton
                currentPath={path}
                icon={<MdMeetingRoom />}
                to='/app/rooms' />
            <BottomNavigationButton
                currentPath={path}
                icon={<FaUserGroup />}
                to='/app/friends' />
            <BottomNavigationButton
                currentPath={path}
                icon={<AiFillDollarCircle />}
                to='/app/subscription' />
            <BottomNavigationButton
                currentPath={path}
                icon={<IoSettingsSharp />}
                to='/app/settings' />
        </div>
    )
}

export default BottomNavigation