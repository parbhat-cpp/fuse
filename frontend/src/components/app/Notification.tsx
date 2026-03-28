import React, { lazy, useEffect, useRef } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { IoIosNotifications } from 'react-icons/io'
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { NOTIFICATION_URL } from 'config'
import { getToken } from '@/lib/utils'
import toast from 'react-hot-toast'
import { List, useDynamicRowHeight } from 'react-window'
import clsx from 'clsx'
import { useSocket } from '@/socket'
import { pushNotification } from '@/utils/notifications'

const NotificationDrawer = lazy(() => import('../notifications/NotificationDrawer'))

type NotificationItem = {
    id: string
    title: string
    message: string
    read: boolean
    template?: {
        content?: string
    }
    data?: Record<string, unknown>
}

type NotificationPage = {
    data: Record<string, NotificationItem[]>
    nextCursor?: string
    totalUnreadCount: number
}

const Notification = () => {
    const socket = useSocket("notification");

    const [cursors, setCursors] = React.useState(new Set<string>());
    const unreadNotificationCount = React.useMemo(() => {
        return {
            count: 0,
            set(count: number) {
                this.count = count;
            }
        }
    }, []);

    const loadNextRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const rowHeight = useDynamicRowHeight({
        defaultRowHeight: 30,
    })

    const [currReadNotification, setCurrReadNotification] = React.useState<NotificationItem | null>(null)
    const [openReadNotification, setOpenReadNotification] = React.useState(false)
    const [nextCursor, setNextCursor] = React.useState('');

    const queryClient = useQueryClient();

    const notifications = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });

    const syncNotificationsQuery = useQuery({
        queryKey: ['sync-notifications'],
        queryFn: syncNotifications,
        refetchInterval: 10 * 60 * 1000, // sync every 10 minutes
    });

    async function getNotifications({ pageParam }: { pageParam: string }): Promise<NotificationPage> {
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
            const data = await response.json();
            if (data.nextCursor) {
                setNextCursor(Object.values(data.data)[0].id);
            }
            unreadNotificationCount.set(data.totalUnreadCount);
            return data as NotificationPage;
        } catch (error) {
            toast.error('Failed to fetch notifications');
            throw error;
        }
    }

    async function syncNotifications() {
        try {
            if (!nextCursor) {
                return [];
            }

            if (cursors.has(nextCursor)) {
                return [];
            }

            const url = `${NOTIFICATION_URL}/sync?cursor=${nextCursor}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to sync notifications');
            }
            const syncData = await response.json();
            if (!syncData || syncData.data.length === 0) {
                return [];
            }
            setCursors(prev => new Set(prev).add(nextCursor));
            setNextCursor(syncData.nextCursor);
            unreadNotificationCount.set(syncData.totalUnreadCount);
            queryClient.setQueryData(['notifications'], (oldData: InfiniteData<NotificationPage>) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: [
                        syncData,
                        ...oldData.pages,
                    ],
                };
            });
            return syncData;
        } catch (error) {
            toast.error('Failed to sync notifications');
            return [];
        }
    }

    async function markAsRead(notificationId: string) {
        try {
            const url = `${NOTIFICATION_URL}/mark-as-read?notificationId=${notificationId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
            // update the specific notification in the cache
            queryClient.setQueryData(['notifications'], (oldData: InfiniteData<NotificationPage>) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        data: Object.fromEntries(
                            Object.entries(page.data).map(([key, notifications]) => [
                                key,
                                notifications.map(notification => notification.id === notificationId ? { ...notification, read: true } : notification)
                            ])
                        )
                    })),
                };
            });
            unreadNotificationCount.set(unreadNotificationCount.count - 1);
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    }

    useEffect(() => {
        const root = scrollContainerRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    notifications.hasNextPage &&
                    !notifications.isFetchingNextPage &&
                    !notifications.isFetching
                ) {
                    notifications.fetchNextPage();
                }
            },
            {
                root,
                threshold: 0.1,
            },
        )
        if (loadNextRef.current) {
            observer.observe(loadNextRef.current)
        }
        return () => {
            if (loadNextRef.current) {
                observer.unobserve(loadNextRef.current)
            }
        }
    }, [notifications.hasNextPage, notifications.fetchNextPage, notifications.isFetchingNextPage, notifications.isFetching])

    useEffect(() => {
        if (!socket || !notifications.data) return;

        socket.on("new-notification", async (data) => {
            pushNotification(data.n_title, { body: data.n_message, icon: '/favicon.ico' });
            syncNotificationsQuery.refetch();
        });

        return () => {
            socket.off("new-notification");
        }
    }, [socket, notifications.data]);

    useEffect(() => {
        document.addEventListener('visibilitychange', tabVisibilityHandler);

        return () => {
            document.removeEventListener('visibilitychange', tabVisibilityHandler);
        }
    }, []);

    // sync when tab gets focus to get the latest notifications
    async function tabVisibilityHandler() {
        if (document.visibilityState === 'visible') {
            syncNotificationsQuery.refetch();
        }
    }

    return (
        <>
            <Drawer direction='right'>
                <DrawerTrigger aria-label='Notifications Drawer Trigger' aria-description='Notification Drawer Trigger' className='relative'>
                    <IoIosNotifications size={28} className='cursor-pointer' /> {unreadNotificationCount.count > 0 && <span className='text-sm font-semibold text-white bg-red-500 rounded-full px-1.5 absolute -top-3 -right-3'>{unreadNotificationCount.count}</span>}
                </DrawerTrigger>
                <DrawerContent aria-label='Notifications Drawer' aria-description='Notification Drawer Content'>
                    <DrawerHeader>
                        <DrawerTitle>Notifications</DrawerTitle>
                    </DrawerHeader>
                    <div ref={scrollContainerRef} className='h-full px-3 py-2 grid gap-3 overflow-y-auto'>
                        {
                            notifications.status === 'pending' ? (
                                <p>Loading...</p>
                            ) : notifications.status === 'error' ? (
                                <p>Error: {notifications.error.message}</p>
                            ) : (
                                notifications.data?.pages.length === 0 ? (
                                    <p>No notifications</p>
                                ) : (
                                    <List
                                        rowComponent={({ index, style }) => {
                                            const group = notifications.data?.pages[index]

                                            if (!group) {
                                                return <div style={style}></div>;
                                            }

                                            return (
                                                <div style={style}>
                                                    {Object.entries(group.data).map(([key, value]) => (
                                                        <div key={key}>
                                                            <h6 className='font-semibold'>{key}</h6>
                                                            <div className='space-y-2'>
                                                                {
                                                                    value.map((notification) => {
                                                                        return <div
                                                                            key={notification.id}
                                                                            className={clsx('p-3 border rounded-md', !notification.read ? 'bg-gray-100' : 'bg-white')}
                                                                            onClick={() => {
                                                                                setCurrReadNotification(notification)
                                                                                setOpenReadNotification(true)
                                                                                markAsRead(notification.id)
                                                                            }}
                                                                        >
                                                                            <p className='font-semibold'>{notification.title}</p>
                                                                            <p className='overflow-hidden whitespace-nowrap text-ellipsis'>{notification.message}</p>
                                                                        </div>
                                                                    })
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                        rowCount={notifications.data?.pages.length || 0}
                                        rowHeight={rowHeight}
                                        rowProps={{ data: notifications.data }}
                                    />
                                )
                            )
                        }
                        <div ref={loadNextRef} className='h-10'></div>
                        <div>{notifications.isFetching && !notifications.isFetchingNextPage ? 'Fetching...' : null}</div>
                    </div>
                </DrawerContent>
            </Drawer>
            <NotificationDrawer open={openReadNotification} onOpenChange={setOpenReadNotification} notification={currReadNotification} />
        </>
    )
}

export default Notification