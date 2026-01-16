import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { API_URL } from 'config'
import { List, useDynamicRowHeight } from 'react-window'
import PublicRoomListItem from './PublicRoomListItem'
import { getToken } from '@/lib/utils'

export default function PublicRooms() {
  const loadNextRef = useRef<HTMLDivElement>(null)
  const [visitedPages, setVisitedPages] = useState(new Set())

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
                  <PublicRoomListItem key={room.roomId} room={room} />
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
