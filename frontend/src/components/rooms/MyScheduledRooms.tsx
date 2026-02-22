import { useInfiniteQuery } from '@tanstack/react-query'
import { API_URL } from 'config'
import { useEffect, useRef } from 'react'
import { List, useDynamicRowHeight } from 'react-window'
import ScheduledRoomListItem from './ScheduledRoomListItem'
import { getToken } from '@/lib/utils'

export default function MyScheduledRooms() {
  const loadNextRef = useRef<HTMLDivElement>(null)

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  })

  const fetchScheduledRooms = async ({
    pageParam,
  }): Promise<Record<string, any>> => {
    const res = await fetch(
      `${API_URL}/room-search/scheduled?page=${pageParam}`,
      {
        headers: {
          Authorization: 'Bearer ' + getToken(),
        },
      },
    )
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
    queryKey: ['scheduled-rooms'],
    queryFn: fetchScheduledRooms,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  })

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
                  <ScheduledRoomListItem key={room.roomId} room={room} />
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
