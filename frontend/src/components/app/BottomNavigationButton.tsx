import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import React from 'react'

interface BottomNavigationButtonProps {
    to: string;
    icon: React.ReactNode;
    currentPath: string;
}

const BottomNavigationButton = (props: BottomNavigationButtonProps) => {
    return (
        <Link to={props.to} className={clsx('flex items-center gap-2 text-lg px-3 p-2 rounded-xl hover:bg-secondary-background hover:text-primary-background', props.currentPath === props.to && 'bg-secondary-background text-primary-background')}>
            {props.icon}
        </Link>
    )
}

export default BottomNavigationButton