import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { API_URL } from 'config'
import { List, useDynamicRowHeight } from 'react-window'
import PublicRoomListItem from './PublicRoomListItem'
import { getToken } from '@/lib/utils'
import { useSocket } from '@/socket'
import toast from 'react-hot-toast'
import { currentRoomActivity, roomActivities, roomData } from '@/store/room'
import { useNavigate } from '@tanstack/react-router'

export default function PublicRooms() {
  const socket = useSocket("room");

  const loadNextRef = useRef<HTMLDivElement>(null)
  const [visitedPages, setVisitedPages] = useState(new Set())
  const [currentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'))

  const navigate = useNavigate();

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  })

  const fetchPublicRooms = async ({
    pageParam,
  }): Promise<Record<string, any>> => {
    const res = await fetch(
      `${API_URL}/room-search/public?page=${pageParam}`,
      {
        headers: {
          Authorization: 'Bearer ' + getToken(),
        },
      },
    )
    setVisitedPages((prev) => new Set([...prev, Number(pageParam)]))
    return res.json()
  }

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['public-rooms'],
    queryFn: fetchPublicRooms,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (visitedPages.has(Number(lastPage.nextCursor))) {
        return null
      }
      return lastPage.nextCursor
    },
  })

  async function handleJoinRoom(roomId: string) {
    socket?.emit('join-room', {
      roomId,
      joinee: JSON.stringify(currentUser),
      publiclyAccessibleRoom: true,
    })
  }

  useEffect(() => {
    if (!socket) return;

    socket.on('access-denied', () => {
      toast.error('Access denied to the room');
    });

    socket.on('plan-expired', () => {
      toast.error('Your plan has expired. Please upgrade to join this room.');
    });

    socket.on('enter-room', (data) => {
      roomData.setState(() => data['roomData'])
      roomActivities.setState(() => data['roomActivities'])
      currentRoomActivity.setState(
        () => data['roomData']['currentActivityData'],
      )
      navigate({
        to: '/app/room',
      })
    });

    return () => {
      socket.off('access-denied');
      socket.off('plan-expired');
      socket.off('enter-room');
    };
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetching
        ) {
          fetchNextPage()
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
  }, [hasNextPage, fetchNextPage])

  return status === 'pending' ? (
    <p>Loading...</p>
  ) : status === 'error' ? (
    <p>Error: {error.message}</p>
  ) : (
    <div className="max-h-[60vh] overflow-y-auto">
      <List
        rowComponent={({ index, style }) => {
          const { rooms } = data.pages[index]
          return (
            <>
              <div style={style} className="space-y-3">
                {rooms?.map((room) => (
                  <PublicRoomListItem key={room.roomId} room={room} handleJoinRoom={handleJoinRoom} />
                ))}
              </div>
            </>
          )
        }}
        rowCount={data.pages.length}
        rowHeight={rowHeight}
        rowProps={{ data }}
      />
      <div ref={loadNextRef}></div>
      <div>{isFetching && !isFetchingNextPage ? 'Fetching...' : null}</div>
    </div>
  )
}
