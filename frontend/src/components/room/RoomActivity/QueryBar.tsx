import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { currentRoomActivity, roomData } from '@/store/room'
import { cn } from '@/lib/utils'
import { useSocket } from '@/socket'

interface QueryBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  queryData: Array<Record<string, any>>
  triggerLoadNext: boolean
  setTriggerLoadNext: (state: boolean) => void
}

const QueryBar = (props: QueryBarProps) => {
  const socket = useSocket('room')

  const queryListRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [props.queryData])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        queryListRef.current &&
        !queryListRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    socket?.on('set-video-id', (data) => {
      toast.success(`${data.username} set new video`)
      roomData.setState(() => data.roomData)
      currentRoomActivity.setState(() => ({
        id: data.id,
        name: data.name,
        videoId: data.videoId,
      }))
    })

    return () => {
      socket?.off('set-video-id')
    }
  }, [socket])

  useEffect(() => {
    if (!loaderRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('intersect')
        if (entries[0].isIntersecting && props.queryData.length) {
          props.setTriggerLoadNext(true)
        }
      },
      { threshold: 1.0 },
    )

    observer.observe(loaderRef.current)

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [props.queryData])

  const handleSelectYoutubeVideo = (videoId: string) => {
    socket?.emit('set-video', {
      roomId: roomData.state?.roomId,
      videoId,
    })
    currentRoomActivity.setState((prev) => ({ ...prev, videoId }))
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      <Input
        className="outline-none border-0"
        {...props}
        onFocus={(_) => setOpen(true)}
      />
      <div
        ref={queryListRef}
        className={cn(
          'absolute top-11 left-5 bg-white z-50 max-h-[60vh] overflow-y-auto',
          !open && 'hidden',
        )}
      >
        {currentRoomActivity.state?.id === 'youtube' && (
          <div>
            {props.queryData.map((vidData) => (
              <div
                key={vidData.etag}
                className="grid grid-cols-4 gap-2 p-2 cursor-pointer"
                onClick={() => handleSelectYoutubeVideo(vidData.id.videoId)}
              >
                <img
                  src={vidData.snippet.thumbnails.default.url}
                  height={vidData.snippet.thumbnails.default.height}
                  width={vidData.snippet.thumbnails.default.width}
                />
                <div className="col-span-3">
                  <h4>{vidData.snippet.title}</h4>
                  <p>{vidData.snippet.publishedAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={loaderRef} className={'p-2 text-center'}>
          {props.triggerLoadNext && <p>Loading...</p>}
        </div>
      </div>
    </div>
  )
}

export default QueryBar
