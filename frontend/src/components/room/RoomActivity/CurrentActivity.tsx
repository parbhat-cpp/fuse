import React, { lazy, useEffect, useRef } from 'react'
import { FaArrowLeft } from 'react-icons/fa6'
import { useStore } from '@tanstack/react-store'
import toast from 'react-hot-toast'
import QueryBar from './QueryBar'
import { currentRoomActivity, roomData } from '@/store/room'
import useYouTubeSearch from '@/hooks/useYouTubeSearch'
import { useSocket } from '@/socket'

const MediaChrome = React.lazy(async () => {
  const mod = await import('media-chrome/react')

  return {
    default: function MediaChromeProvider(props: {
      children: (components: typeof mod) => React.ReactNode
    }) {
      return <>{props.children(mod)}</>
    },
  }
})
const ReactPlayer = lazy(() => import('react-player'))

const CurrentActivity = () => {
  const socket = useSocket('room')

  const ytPlayerRef = useRef<HTMLVideoElement>(null)
  const {
    searchResults,
    searchQuery,
    setSearchQuery,
    triggerLoadNext,
    setTriggerLoadNext,
  } = useYouTubeSearch()

  const activityId = useStore(currentRoomActivity, (s) => s?.id)
  const videoId = useStore(currentRoomActivity, (s) => s?.videoId)

  const handleExitCurrentActivity = () => {
    currentRoomActivity.setState(undefined)
  }

  useEffect(() => {
    if (ytPlayerRef.current) ytPlayerRef.current.play()
  }, [videoId])

  useEffect(() => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.addEventListener('pause', (_) => {
        socket?.emit('pause-video', roomData.state?.roomId)
      })

      ytPlayerRef.current.addEventListener('play', (_) => {
        socket?.emit('play-video', roomData.state?.roomId)
      })

      ytPlayerRef.current.addEventListener('seeked', (_) => {
        socket?.emit('seek-video', {
          roomId: roomData.state?.roomId,
          position: ytPlayerRef.current?.currentTime,
        })
      })
    }

    return () => {
      ytPlayerRef.current?.removeEventListener('pause', (_) =>
        socket?.emit('pause-video', roomData.state?.roomId),
      )
      ytPlayerRef.current?.removeEventListener('play', (_) =>
        socket?.emit('play-video', roomData.state?.roomId),
      )
      ytPlayerRef.current?.removeEventListener('seeked', (_) =>
        socket?.emit('seek-video', {
          roomId: roomData.state?.roomId,
          position: ytPlayerRef.current?.currentTime,
        }),
      )
    }
  }, [ytPlayerRef.current])

  useEffect(() => {
    socket?.on('set-video-play', (username) => {
      toast.success(`${username} played the video`)
      if (ytPlayerRef.current) ytPlayerRef.current.play()
    })

    socket?.on('set-video-pause', (username) => {
      toast.success(`${username} paused the video`)
      if (ytPlayerRef.current) ytPlayerRef.current.pause()
    })

    socket?.on('seek-to-video', (data) => {
      toast.success(`${data.username} seeked video`)
      if (ytPlayerRef.current) ytPlayerRef.current.currentTime = data.position
    })

    return () => {
      socket?.off('set-video-play')
      socket?.off('set-video-pause')
      socket?.off('seek-to-video')
    }
  }, [socket])

  return (
    <div className="px-3 py-2 grid gap-3">
      <div className="flex gap-3 items-center">
        <button onClick={handleExitCurrentActivity} className="cursor-pointer">
          <FaArrowLeft size={24} />
        </button>
        {activityId === 'youtube' && (
          <QueryBar
            value={searchQuery}
            placeholder="YouTube Search"
            onChange={(e) => setSearchQuery(e.target.value)}
            queryData={searchResults}
            triggerLoadNext={triggerLoadNext}
            setTriggerLoadNext={setTriggerLoadNext}
          />
        )}
      </div>
      {activityId === 'youtube' && (
        <React.Suspense fallback={<div>Loading player…</div>}>
          <MediaChrome>
            {({
              MediaController,
              MediaControlBar,
              MediaFullscreenButton,
              MediaMuteButton,
              MediaPlayButton,
              MediaPlaybackRateButton,
              MediaSeekBackwardButton,
              MediaSeekForwardButton,
              MediaTimeDisplay,
              MediaTimeRange,
              MediaVolumeRange,
            }) => (
              <MediaController
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                }}
              >
                <ReactPlayer
                  ref={ytPlayerRef}
                  slot="media"
                  src={`https://www.youtube.com/watch?v=${videoId}`}
                  controls={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    // "--controls": "none",
                  }}
                ></ReactPlayer>
                <MediaControlBar>
                  <MediaPlayButton />
                  <MediaMuteButton />
                  <MediaSeekBackwardButton />
                  <MediaSeekForwardButton />
                  <MediaPlaybackRateButton />
                  <MediaVolumeRange />
                  <MediaTimeDisplay />
                  <MediaTimeRange />
                  <MediaFullscreenButton />
                </MediaControlBar>
              </MediaController>
            )}
          </MediaChrome>
        </React.Suspense>
      )}
    </div>
  )
}

export default CurrentActivity
