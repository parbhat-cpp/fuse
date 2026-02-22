import React, { useEffect, useRef } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { IoIosNotifications } from 'react-icons/io'
import { useInfiniteQuery } from '@tanstack/react-query'
import { NOTIFICATION_URL } from 'config'
import { getToken } from '@/lib/utils'
import toast from 'react-hot-toast'
import { List, useDynamicRowHeight } from 'react-window'
import clsx from 'clsx'

const Notification = () => {
    const loadNextRef = useRef<HTMLDivElement>(null)
    const rowHeight = useDynamicRowHeight({
        defaultRowHeight: 40,
    })

    const notifications = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });

    async function getNotifications({ pageParam }) {
        try {
            const url = `${NOTIFICATION_URL}?limit=10${pageParam ? `&cursor=${pageParam}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            return response.json();
        } catch (error) {
            toast.error('Failed to fetch notifications');
            return [];
        }
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    notifications.hasNextPage &&
                    !notifications.isFetchingNextPage &&
                    !notifications.isFetching
                ) {
                    notifications.fetchNextPage()
                }
            },
            { threshold: 1 },
        )
        if (loadNextRef.current) {
            observer.observe(loadNextRef.current)
        }
        return () => {
            if (loadNextRef.current) {
                observer.unobserve(loadNextRef.current)
            }
        }
    }, [notifications.hasNextPage, notifications.fetchNextPage])

    return (
        <Drawer direction='right'>
            <DrawerTrigger>
                <IoIosNotifications size={28} className='cursor-pointer' />
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Notifications</DrawerTitle>
                </DrawerHeader>
                <div className='h-full px-3 py-2 flex flex-col gap-3 overflow-auto'>
                    {
                        notifications.status === 'pending' ? (
                            <p>Loading...</p>
                        ) : notifications.status === 'error' ? (
                            <p>Error: {notifications.error.message}</p>
                        ) : (
                            <List
                                rowComponent={({ index, style }) => {
                                    const group = notifications.data?.pages[index]
                                    return Object.entries(group.data).map(([key, value]) => (
                                        <div key={key}>
                                            <h6 className='font-semibold'>{key}</h6>
                                            <div className='space-y-2'>
                                                {
                                                    value.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={clsx('p-3 border rounded-md', !notification.read ? 'bg-gray-100' : 'bg-white')}
                                                        >
                                                            <p className='font-semibold'>{notification.title}</p>
                                                            <p className='overflow-hidden whitespace-nowrap text-ellipsis'>{notification.message}</p>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ));
                                }}
                                rowCount={notifications.data?.pages.length || 0}
                                rowHeight={rowHeight}
                                rowProps={{ data: notifications.data }}
                            />
                        )
                    }
                    <div>{notifications.isFetching && !notifications.isFetchingNextPage ? 'Fetching...' : null}</div>
                </div>
                <div ref={loadNextRef}></div>
            </DrawerContent>
        </Drawer>
    )
}

export default Notification