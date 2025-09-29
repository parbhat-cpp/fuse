import React from 'react'
import { Link } from '@tanstack/react-router'
import clsx from 'clsx';

interface SidebarButtonProps {
    to: string;
    text: string;
    icon: React.ReactNode;
    currentPath: string;
}

const SidebarButton = (props: SidebarButtonProps) => {
    return (
        <Link to={props.to} className={clsx('flex items-center gap-2 text-lg px-3 p-2 rounded-xl hover:bg-secondary-background hover:text-primary-background', props.currentPath === props.to && 'bg-secondary-background text-primary-background')}>
            {props.icon} {props.text}
        </Link>
    )
}

export default SidebarButton